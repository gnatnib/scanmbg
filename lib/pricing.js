import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

/**
 * Estimate ingredient-level and total menu pricing for an MBG meal.
 * Uses Gemini to understand Indonesian market wholesale food prices.
 *
 * MBG budget is ~Rp 15,000 per portion.
 */
export async function estimatePricing(enrichedItems) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const itemList = enrichedItems.map((item) => `- ${item.nama}: ${item.porsi_gram}g (${item.kategori})`).join("\n");

  const prompt = `Kamu adalah ahli ekonomi pangan Indonesia yang mengerti harga bahan makanan di pasar tradisional/grosir.

Estimasikan harga bahan makanan mentah (bukan harga jual) untuk membuat satu porsi menu berikut.
Gunakan harga pasar tradisional Indonesia tahun 2024-2025 untuk estimasi.

Menu:
${itemList}

PENTING:
- Harga adalah harga BAHAN MENTAH per porsi (bukan harga jalan/restoran)
- Konversi dari harga per kg ke harga per gram sesuai porsi
- Sertakan estimasi biaya bumbu/minyak goreng jika item digoreng/ditumis (~Rp 500-1500)
- Sertakan biaya overhead memasak (gas, tenaga) sekitar 15-20% dari total bahan
- Budget MBG pemerintah adalah Rp 15.000 per porsi

FORMAT RESPONS (JSON):
{
  "items": [
    {
      "nama": "string",
      "harga_bahan_per_kg": number (Rp),
      "gram_digunakan": number,
      "harga_porsi": number (Rp),
      "catatan": "string opsional"
    }
  ],
  "biaya_bumbu_minyak": number (Rp),
  "biaya_overhead": number (Rp),
  "total_estimasi": number (Rp),
  "budget_mbg": 15000,
  "selisih": number (Rp, positif = di bawah budget, negatif = di atas budget),
  "penilaian": "string (singkat, apakah realistis dengan budget MBG Rp15rb)"
}`;

  const result = await model.generateContent([prompt]);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Failed to parse pricing response");
  }
}
