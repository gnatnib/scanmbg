const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const VISION_MODEL = "google/gemini-2.5-flash";
const EXPLAIN_MODEL = "google/gemini-2.5-flash";

const FOOD_ANALYSIS_PROMPT = `Kamu adalah ahli identifikasi makanan Indonesia. Tugasmu HANYA mengidentifikasi makanan yang terlihat dalam foto baki MBG (Makan Bergizi Gratis).

TUGAS:
Identifikasi SETIAP makanan yang terlihat di baki. Berikan nama, kategori, dan estimasi berat.

INSTRUKSI:
1. Identifikasi setiap item makanan yang terlihat secara terpisah
2. Berikan nama makanan dalam Bahasa Indonesia yang umum
3. Buat kunci (key) dalam format snake_case (contoh: "ayam_goreng", "nasi_putih")
4. Klasifikasikan ke kategori yang tepat
5. Estimasi berat porsi dalam gram berdasarkan ukuran visual terhadap baki MBG standar (25x20cm)
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
}

PENTING: Respons HARUS berupa JSON valid. Jangan tulis apapun selain JSON.`;

async function openrouterChat(messages, { model, temperature = 0.2, maxTokens = 1200, timeoutMs = 30000 } = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://scanmbg.vercel.app",
        "X-Title": "ScanMBG",
      },
      body: JSON.stringify({
        model: model || VISION_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timer);
    if (fetchErr.name === "AbortError") {
      throw new Error("OpenRouter timeout");
    }
    throw fetchErr;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    console.error(`OpenRouter HTTP ${res.status}:`, errText.substring(0, 300));
    throw new Error(`OpenRouter ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();

  if (data.error) {
    console.error("OpenRouter API error:", JSON.stringify(data.error));
    throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const content = data.choices?.[0]?.message?.content || "";
  console.log("OpenRouter response (first 300 chars):", content.substring(0, 300));

  if (!content) {
    throw new Error("OpenRouter returned empty response");
  }

  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        console.error("OpenRouter JSON extraction failed:", jsonMatch[0].substring(0, 200));
        throw new Error("OpenRouter returned invalid JSON");
      }
    }
    console.error("OpenRouter no JSON found in response:", content.substring(0, 300));
    throw new Error("Failed to parse OpenRouter JSON response");
  }
}

export async function analyzeFoodTrayViaOpenRouter(imageBase64, mimeType = "image/jpeg") {
  const messages = [
    {
      role: "system",
      content: FOOD_ANALYSIS_PROMPT,
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
          },
        },
        {
          type: "text",
          text: "Identifikasi setiap makanan dalam foto baki MBG ini. Berikan nama, kategori, dan estimasi berat gram saja. Respons HARUS JSON valid.",
        },
      ],
    },
  ];

  return openrouterChat(messages, { temperature: 0.2, maxTokens: 1200, timeoutMs: 30000 });
}

export async function analyzeExplanationViaOpenRouter(enrichedItems, totals, mbgScore) {
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
}

PENTING: Respons HARUS berupa JSON valid. Jangan tulis apapun selain JSON.`;

  const messages = [
    { role: "system", content: "Kamu ahli gizi Indonesia. Respons harus dalam format JSON." },
    { role: "user", content: prompt },
  ];

  return openrouterChat(messages, { model: EXPLAIN_MODEL, temperature: 0.3, maxTokens: 1200, timeoutMs: 25000 });
}
