const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
const MODEL = "qwen3.5:397b";

async function chatCompletion(messages, { temperature = 0.3, maxTokens = 1200 } = {}) {
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
 * AI explanation: nutrition analysis and score explanation.
 * Called LAZILY by the result page via /api/explain — NOT in the main scan pipeline.
 * Pricing is handled locally by pricing-db.js (instant, no AI).
 */
export async function analyzeWithOllama(enrichedItems, totals, mbgScore) {
  const itemList = enrichedItems
    .map((item) => {
      const src = item.sumber_data === "estimasi_ai" ? " [estimasi AI]" : " [TKPI]";
      return `- ${item.nama} (${item.porsi_gram}g, ${item.kategori})${src}: E=${item.nutrisi_porsi.energi?.toFixed(0)}kcal P=${item.nutrisi_porsi.protein?.toFixed(1)}g L=${item.nutrisi_porsi.lemak?.toFixed(1)}g K=${item.nutrisi_porsi.karbohidrat?.toFixed(1)}g`;
    })
    .join("\n");

  const scoreDetails = mbgScore.details
    .map((d) => `- ${d.kriteria}: ${d.score}/${d.maxScore} (${d.nilai} vs standar ${d.standar})`)
    .join("\n");

  const messages = [
    {
      role: "system",
      content: `Kamu ahli gizi Indonesia. Analisis menu MBG (Makan Bergizi Gratis) — program pemerintah RI, budget Rp 15.000/porsi.

Tugas: Jelaskan mengapa skor ${mbgScore.score}/10, breakdown nutrisi per item, dan beri 3 rekomendasi perbaikan.
Bahasa Indonesia santai tapi informatif. JANGAN gunakan markdown. Langsung ke inti.`
    },
    {
      role: "user",
      content: `MENU:
${itemList}

TOTAL: ${Math.round(totals.energi)}kcal | P:${totals.protein?.toFixed(1)}g | L:${totals.lemak?.toFixed(1)}g | K:${totals.karbohidrat?.toFixed(1)}g | Serat:${totals.serat?.toFixed(1)}g

SKOR: ${mbgScore.score}/10 (${mbgScore.gradeLabel})
${scoreDetails}

JSON response:
{
  "penjelasan_skor": "2-3 paragraf mengapa skor ${mbgScore.score}/10",
  "penjelasan_nutrisi": "breakdown nutrisi per item, mana yang menyumbang paling banyak",
  "rekomendasi": ["saran 1", "saran 2", "saran 3"]
}`
    },
  ];

  return chatCompletion(messages, { temperature: 0.3, maxTokens: 1200 });
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
      content: `Kamu ahli gizi Indonesia. Berikan estimasi nutrisi per 100g untuk makanan Indonesia berikut berdasarkan TKPI.`
    },
    {
      role: "user",
      content: `Estimasi nutrisi per 100g:
${itemList}

JSON:
{
  "items": [
    {
      "nama": "string",
      "kategori": "string",
      "nutrisi_per_100g": {
        "energi": number, "protein": number, "lemak": number,
        "karbohidrat": number, "serat": number, "kalsium": number,
        "zat_besi": number, "vitamin_a": number, "vitamin_c": number
      }
    }
  ]
}`
    },
  ];

  return chatCompletion(messages, { temperature: 0.2, maxTokens: 800 });
}

/**
 * Vision fallback: detect food items from image using Qwen multimodal.
 * Used when Gemini is rate-limited (429) or unavailable (503).
 */
export async function analyzeFoodTrayWithQwen(imageBase64, mimeType = "image/jpeg") {
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;

  const messages = [
    {
      role: "system",
      content: `Identifikasi SETIAP makanan di baki MBG. Berikan nama Bahasa Indonesia, key snake_case, kategori, estimasi gram, dan nutrisi per 100g.

KATEGORI: protein_hewani, protein_nabati, karbohidrat, sayur, buah, lainnya

PORSI: Nasi 150-200g, Lauk 50-80g, Sayur 50-80g, Buah 50-100g

JSON:
{
  "items": [{"key":"snake_case","nama":"Nama","kategori":"kategori","estimasi_gram":number,"confidence":number,"nutrisi_per_100g":{"energi":number,"protein":number,"lemak":number,"karbohidrat":number,"serat":number,"kalsium":number,"zat_besi":number,"vitamin_a":number,"vitamin_c":number}}],
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
          text: "Identifikasi setiap makanan dalam foto baki MBG ini.",
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
      max_tokens: 1000,
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
