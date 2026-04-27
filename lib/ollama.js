/**
 * Ollama Qwen3-VL client
 * Uses OpenAI-compatible /v1/chat/completions endpoint
 * 
 * Handles: nutrition analysis, pricing estimation, score explanations
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
const MODEL = "qwen3.5:397b";

async function chatCompletion(messages, { temperature = 0.3, maxTokens = 4000 } = {}) {
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`Ollama API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Failed to parse Ollama JSON response");
  }
}

/**
 * Comprehensive food analysis: nutrition details, pricing, and score explanation.
 * Called AFTER Gemini detects items + TKPI enrichment + scoring.
 */
export async function analyzeWithOllama(enrichedItems, totals, mbgScore) {
  const itemList = enrichedItems
    .map((item) => {
      const src = item.sumber_data === "estimasi_ai" ? " [estimasi AI]" : " [TKPI]";
      return `- ${item.nama} (${item.porsi_gram}g, kategori: ${item.kategori})${src}
    Nutrisi per porsi: energi=${item.nutrisi_porsi.energi?.toFixed(1)}kcal, protein=${item.nutrisi_porsi.protein?.toFixed(1)}g, lemak=${item.nutrisi_porsi.lemak?.toFixed(1)}g, karbo=${item.nutrisi_porsi.karbohidrat?.toFixed(1)}g`;
    })
    .join("\n");

  const scoreDetails = mbgScore.details
    .map((d) => `- ${d.kriteria}: ${d.score}/${d.maxScore} (${d.nilai} vs standar ${d.standar})`)
    .join("\n");

  const messages = [
    {
      role: "system",
      content: `Kamu adalah ahli gizi dan ekonomi pangan Indonesia. Kamu menganalisis menu Makan Bergizi Gratis (MBG) — program pemerintah RI yang memberikan makan gratis untuk 82 juta anak sekolah dengan budget Rp 15.000 per porsi.

Tugasmu:
1. Berikan penjelasan DETAIL mengapa skor gizi menu ini adalah ${mbgScore.score}/10
2. Jelaskan dari mana angka nutrisi berasal (item mana menyumbang berapa)
3. Estimasi harga bahan mentah pasar tradisional Indonesia 2024-2025
4. Beri rekomendasi perbaikan menu

Gunakan Bahasa Indonesia yang santai tapi informatif. Jangan gunakan markdown formatting.`
    },
    {
      role: "user",
      content: `Analisis menu MBG berikut:

MAKANAN TERDETEKSI:
${itemList}

TOTAL NUTRISI:
- Energi: ${totals.energi} kcal
- Protein: ${totals.protein}g
- Lemak: ${totals.lemak}g  
- Karbohidrat: ${totals.karbohidrat}g
- Serat: ${totals.serat}g

SKOR MBG: ${mbgScore.score}/10 (${mbgScore.gradeLabel})
DETAIL SKOR:
${scoreDetails}

Berikan respons dalam JSON format:
{
  "penjelasan_skor": "string — penjelasan 2-3 paragraf mengapa skor adalah ${mbgScore.score}/10, jelaskan setiap komponen skor secara logis dan mudah dipahami",
  "penjelasan_nutrisi": "string — jelaskan dari mana angka protein/karbo/lemak berasal, item mana menyumbang paling banyak",
  "rekomendasi": ["string — saran perbaikan menu, maksimal 3 item"],
  "pricing": {
    "items": [
      {
        "nama": "string",
        "harga_bahan_per_kg": number,
        "gram_digunakan": number,
        "harga_porsi": number
      }
    ],
    "biaya_bumbu_minyak": number,
    "biaya_overhead": number,
    "total_estimasi": number,
    "budget_mbg": 15000,
    "selisih": number,
    "penilaian": "string — apakah realistis dengan budget Rp 15rb"
  }
}`
    },
  ];

  return chatCompletion(messages, { temperature: 0.3, maxTokens: 4000 });
}

/**
 * Analyze custom/unknown food items that aren't in TKPI database.
 * Returns nutrition estimates for manual input items.
 */
export async function estimateCustomNutrition(customItems) {
  const itemList = customItems
    .map((item) => `- ${item.nama} (${item.gram}g, kategori: ${item.kategori})`)
    .join("\n");

  const messages = [
    {
      role: "system",
      content: `Kamu adalah ahli gizi Indonesia. Berikan estimasi nutrisi per 100g untuk makanan Indonesia berikut. Gunakan pengetahuanmu tentang TKPI (Tabel Komposisi Pangan Indonesia) dan data gizi makanan Indonesia.`
    },
    {
      role: "user",
      content: `Estimasi nutrisi per 100g untuk makanan berikut:
${itemList}

Respons dalam JSON:
{
  "items": [
    {
      "nama": "string",
      "kategori": "string",
      "nutrisi_per_100g": {
        "energi": number,
        "protein": number,
        "lemak": number,
        "karbohidrat": number,
        "serat": number,
        "kalsium": number,
        "zat_besi": number,
        "vitamin_a": number,
        "vitamin_c": number
      }
    }
  ]
}`
    },
  ];

  return chatCompletion(messages, { temperature: 0.2, maxTokens: 2000 });
}

/**
 * Vision fallback: detect food items from image using Qwen3-VL multimodal.
 * Used when Gemini is rate-limited (429) or unavailable (503).
 */
export async function analyzeFoodTrayWithQwen(imageBase64, mimeType = "image/jpeg") {
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;

  const messages = [
    {
      role: "system",
      content: `Kamu adalah ahli identifikasi makanan Indonesia. Identifikasi SETIAP makanan yang terlihat di baki MBG (Makan Bergizi Gratis).

Berikan nama dalam Bahasa Indonesia, key dalam snake_case, kategori, estimasi berat gram, dan estimasi nutrisi per 100g.

KATEGORI: protein_hewani, protein_nabati, karbohidrat, sayur, buah, lainnya

PANDUAN PORSI:
- Nasi putih: 150-200g
- Lauk utama: 50-80g
- Protein nabati: 30-50g
- Sayur: 50-80g
- Buah: 50-100g

Respons HARUS dalam JSON valid:
{
  "items": [
    {
      "key": "snake_case",
      "nama": "Nama Makanan",
      "kategori": "kategori",
      "estimasi_gram": number,
      "confidence": number (0-1),
      "nutrisi_per_100g": {
        "energi": number, "protein": number, "lemak": number,
        "karbohidrat": number, "serat": number, "kalsium": number,
        "zat_besi": number, "vitamin_a": number, "vitamin_c": number
      }
    }
  ],
  "deskripsi_menu": "string",
  "catatan": "string"
}`
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
          text: "Identifikasi setiap makanan dalam foto baki MBG ini. Berikan nama, kategori, estimasi gram, dan nutrisi per 100g.",
        },
      ],
    },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`Qwen vision error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Failed to parse Qwen vision response");
  }
}
