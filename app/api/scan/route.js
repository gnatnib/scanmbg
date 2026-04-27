import { NextResponse } from "next/server";
import { analyzeFoodTray } from "@/lib/gemini";
import { enrichWithTkpi, calculateTotals, getCategoryBreakdown } from "@/lib/nutrition-db";
import { calculateMbgScore } from "@/lib/scoring";
import { analyzeWithOllama, estimateCustomNutrition, analyzeFoodTrayWithQwen } from "@/lib/ollama";

export const maxDuration = 90;

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, mimeType, manualItems } = body;

    let geminiItems;
    let deskripsi = "";
    let catatan = "";

    if (manualItems && manualItems.length > 0) {
      // ── Manual input mode ──
      // Separate known TKPI items from custom items
      const customItems = [];
      const knownItems = [];

      for (const m of manualItems) {
        const itemData = {
          key: m.nama.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
          nama: m.nama,
          kategori: m.kategori || "lainnya",
          estimasi_gram: m.gram || 100,
          confidence: 1.0,
          nutrisi_per_100g: null,
        };

        knownItems.push(itemData);
        if (m.isCustom) {
          customItems.push(m);
        }
      }

      // If there are custom items not in TKPI, ask Ollama for nutrition estimates
      if (customItems.length > 0) {
        try {
          const ollamaEstimates = await estimateCustomNutrition(customItems);
          if (ollamaEstimates?.items) {
            for (const est of ollamaEstimates.items) {
              const match = knownItems.find(
                (k) => k.nama.toLowerCase() === est.nama.toLowerCase()
              );
              if (match && est.nutrisi_per_100g) {
                match.nutrisi_per_100g = est.nutrisi_per_100g;
              }
            }
          }
        } catch (err) {
          console.error("Ollama custom nutrition error:", err);
          // Continue — TKPI enrichment may still find matches
        }
      }

      geminiItems = knownItems;
      deskripsi = buildAutoDescription(knownItems);

    } else if (image) {
      // ── Vision scan mode (Gemini) ──
      if (!process.env.GOOGLE_GEMINI_API_KEY) {
        return NextResponse.json(
          { error: "API key belum dikonfigurasi. Tambahkan GOOGLE_GEMINI_API_KEY di .env.local" },
          { status: 500 }
        );
      }

      let geminiResult;
      let visionSource = "gemini";
      try {
        geminiResult = await analyzeFoodTray(image, mimeType || "image/jpeg");
      } catch (geminiErr) {
        const errMsg = geminiErr.message || "";
        const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Too Many Requests");
        const isUnavailable = errMsg.includes("503") || errMsg.includes("Service Unavailable");

        if (isRateLimit || isUnavailable) {
          // ── Fallback to Qwen 3.5 vision ──
          console.log(`Gemini ${isRateLimit ? "429" : "503"} — falling back to Qwen vision...`);
          try {
            geminiResult = await analyzeFoodTrayWithQwen(image, mimeType || "image/jpeg");
            visionSource = "qwen";
          } catch (qwenErr) {
            console.error("Qwen vision fallback also failed:", qwenErr.message);
            return NextResponse.json(
              { error: isRateLimit
                ? "Kuota Gemini habis & Qwen fallback gagal. Gunakan tab Manual."
                : "AI vision sedang tidak tersedia. Gunakan tab Manual." },
              { status: isRateLimit ? 429 : 503 }
            );
          }
        } else {
          throw geminiErr;
        }
      }

      if (!geminiResult.items || geminiResult.items.length === 0) {
        return NextResponse.json(
          { error: "Tidak dapat mendeteksi makanan dalam gambar. Coba foto yang lebih jelas." },
          { status: 422 }
        );
      }

      geminiItems = geminiResult.items;
      deskripsi = geminiResult.deskripsi_menu || "";
      catatan = (geminiResult.catatan || "") + (visionSource === "qwen" ? " [Dianalisis oleh Qwen 3.5 — Gemini sedang tidak tersedia]" : "");
    } else {
      return NextResponse.json({ error: "Gambar atau input manual diperlukan" }, { status: 400 });
    }

    // ── Step 2: Enrich with TKPI database ──
    const enrichedItems = enrichWithTkpi(geminiItems);

    // ── Step 3: Calculate totals ──
    const totals = calculateTotals(enrichedItems);

    // ── Step 4: Calculate MBG score ──
    const mbgScore = calculateMbgScore(enrichedItems, totals);

    // ── Step 5: Category breakdown ──
    const categoryBreakdown = getCategoryBreakdown(enrichedItems);

    // ── Step 6: Ollama analysis (nutrition explanation + pricing + recommendations) ──
    let aiAnalysis = null;
    let pricing = null;
    try {
      aiAnalysis = await analyzeWithOllama(enrichedItems, totals, mbgScore);
      if (aiAnalysis?.pricing) {
        pricing = aiAnalysis.pricing;
      }
    } catch (err) {
      console.error("Ollama analysis error:", err);
      // Non-fatal — continue without AI analysis
    }

    const scanId = generateScanId();

    const result = {
      id: scanId,
      timestamp: new Date().toISOString(),
      items: enrichedItems,
      totals,
      mbgScore,
      categoryBreakdown,
      pricing,
      aiAnalysis: aiAnalysis
        ? {
            penjelasan_skor: aiAnalysis.penjelasan_skor || "",
            penjelasan_nutrisi: aiAnalysis.penjelasan_nutrisi || "",
            rekomendasi: aiAnalysis.rekomendasi || [],
          }
        : null,
      deskripsi: deskripsi || buildAutoDescription(enrichedItems),
      catatan: catatan || "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menganalisis. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

function generateScanId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function buildAutoDescription(items) {
  const names = items.map((i) => i.nama);
  if (names.length <= 2) return names.join(" dan ");
  return names.slice(0, -1).join(", ") + ", dan " + names.at(-1);
}
