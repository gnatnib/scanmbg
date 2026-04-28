import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const SYSTEM_PROMPT = `Kamu adalah ahli identifikasi makanan Indonesia. Tugasmu HANYA mengidentifikasi makanan yang terlihat dalam foto baki MBG (Makan Bergizi Gratis).

TUGAS:
Identifikasi SETIAP makanan yang terlihat di baki. Berikan nama, kategori, dan estimasi berat.

INSTRUKSI:
1. Identifikasi setiap item makanan yang terlihat secara terpisah
2. Berikan nama makanan dalam Bahasa Indonesia yang umum
3. Buat kunci (key) dalam format snake_case (contoh: "ayam_goreng", "nasi_putih")
4. Klasifikasikan ke kategori yang tepat
5. Estimasi berat porsi dalam gram berdasarkan ukuran visual terhadap baki MBG standar (25×20cm)
6. Jangan mengarang makanan yang tidak terlihat
7. Baki MBG biasanya memiliki 5-6 kompartemen

PANDUAN ESTIMASI PORSI:
- Nasi putih (kompartemen besar): 150-200g
- Lauk utama (ayam/ikan): 50-80g
- Lauk tambahan/protein nabati: 30-50g
- Sayur: 50-80g
- Buah: 50-100g

KATEGORI yang valid:
- protein_hewani: daging, ikan, telur, seafood
- protein_nabati: tempe, tahu, kacang-kacangan
- karbohidrat: nasi, mie, roti, kentang
- sayur: semua jenis sayuran dan lalapan
- buah: semua jenis buah
- lainnya: kerupuk, sambal, saus, dll

FORMAT RESPONS (JSON):
{
  "items": [
    {
      "key": "string (snake_case identifier)",
      "nama": "string (nama dalam Bahasa Indonesia)",
      "kategori": "string (salah satu kategori di atas)",
      "estimasi_gram": number,
      "confidence": number (0.0-1.0),
      "nutrisi_per_100g": {
        "energi": number (kcal),
        "protein": number (g),
        "lemak": number (g),
        "karbohidrat": number (g),
        "serat": number (g),
        "kalsium": number (mg),
        "zat_besi": number (mg),
        "vitamin_a": number (mcg),
        "vitamin_c": number (mg)
      }
    }
  ],
  "deskripsi_menu": "string (deskripsi singkat menu keseluruhan)",
  "catatan": "string (catatan tambahan jika ada)"
}`;

export async function analyzeFoodTray(imageBase64, mimeType = "image/jpeg") {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  const MAX_RETRIES = 1;
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent([
        SYSTEM_PROMPT,
        imagePart,
        "Identifikasi setiap makanan dalam foto baki MBG ini. Berikan nama, kategori, dan estimasi berat gram saja.",
      ]);

      const response = result.response;
      const text = response.text();

      try {
        return JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Failed to parse Gemini response as JSON");
      }
    } catch (err) {
      lastError = err;
      const msg = err.message || "";
      // Only retry on transient errors (429, 503), not on permanent ones
      const isRetryable = msg.includes("429") || msg.includes("503") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
      if (attempt < MAX_RETRIES && isRetryable) {
        console.log(`Gemini attempt ${attempt + 1} failed (${msg.substring(0, 80)}), retrying in 1.5s...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

/**
 * Fast AI explanation using Gemini text model.
 */
export async function analyzeExplanationWithGemini(enrichedItems, totals, mbgScore) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const itemList = enrichedItems
    .map((item) => {
      const src = item.sumber_data === "estimasi_ai" ? " [estimasi AI]" : " [TKPI]";
      return `- ${item.nama} (${item.porsi_gram}g, ${item.kategori})${src}: E=${item.nutrisi_porsi.energi?.toFixed(0)}kcal P=${item.nutrisi_porsi.protein?.toFixed(1)}g L=${item.nutrisi_porsi.lemak?.toFixed(1)}g K=${item.nutrisi_porsi.karbohidrat?.toFixed(1)}g`;
    })
    .join("\n");

  const scoreDetails = mbgScore.details
    .map((d) => `- ${d.kriteria}: ${d.score}/${d.maxScore} (${d.nilai} vs standar ${d.standar})`)
    .join("\n");

  const prompt = `Kamu ahli gizi Indonesia. Analisis menu MBG (Makan Bergizi Gratis) — program pemerintah RI, budget Rp 15.000/porsi.

Tugas: Jelaskan mengapa skor ${mbgScore.score}/10, breakdown nutrisi per item, dan beri 3 rekomendasi perbaikan.
Bahasa Indonesia santai tapi informatif. Langsung ke inti.

MENU:
${itemList}

TOTAL: ${Math.round(totals.energi)}kcal | P:${totals.protein?.toFixed(1)}g | L:${totals.lemak?.toFixed(1)}g | K:${totals.karbohidrat?.toFixed(1)}g | Serat:${totals.serat?.toFixed(1)}g

SKOR: ${mbgScore.score}/10 (${mbgScore.gradeLabel})
${scoreDetails}

Keluarkan dalam JSON:
{
  "penjelasan_skor": "2-3 paragraf mengapa skor ${mbgScore.score}/10",
  "penjelasan_nutrisi": "breakdown nutrisi per item, mana yang menyumbang paling banyak",
  "rekomendasi": ["saran 1", "saran 2", "saran 3"]
}`;

  const result = await model.generateContent([prompt]);
  const text = result.response.text();
  
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Gagal parsing JSON Gemini");
  }
}
