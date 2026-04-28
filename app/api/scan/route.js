import { NextResponse } from "next/server";
import { analyzeFoodTray } from "@/lib/gemini";
import { enrichWithTkpi, calculateTotals, getCategoryBreakdown } from "@/lib/nutrition-db";
import { calculateMbgScore } from "@/lib/scoring";
import { estimateLocalPricing } from "@/lib/pricing-db";
import { estimateCustomNutrition, analyzeFoodTrayWithQwen } from "@/lib/ollama";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, mimeType, manualItems } = body;

    let geminiItems;
    let deskripsi = "";
    let catatan = "";

    if (manualItems && manualItems.length > 0) {
      // ── Manual input mode ──
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
        }
      }

      geminiItems = knownItems;
      deskripsi = buildAutoDescription(knownItems);

    } else if (image) {
      // ── Vision scan mode ──
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
        const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Too Many Requests") || errMsg.includes("RESOURCE_EXHAUSTED");
        const isUnavailable = errMsg.includes("503") || errMsg.includes("Service Unavailable");
        const isTimeout = errMsg.includes("timeout") || errMsg.includes("DEADLINE_EXCEEDED");

        if (isRateLimit || isUnavailable || isTimeout) {
          // ── Fallback to Qwen vision ──
          console.log(`Gemini failed (${errMsg.substring(0, 100)}) — falling back to Qwen vision...`);
          try {
            geminiResult = await analyzeFoodTrayWithQwen(image, mimeType || "image/jpeg");
            visionSource = "qwen";
          } catch (qwenErr) {
            console.error("Qwen vision fallback also failed:", qwenErr.message);
            const qwenMsg = qwenErr.message || "";
            const isQwenTimeout = qwenMsg.includes("timeout") || qwenMsg.includes("AbortError");
            return NextResponse.json(
              { error: isQwenTimeout
                ? "AI sedang sibuk (timeout). Silakan coba lagi dalam beberapa detik."
                : `AI vision gagal. Silakan coba lagi atau gunakan Input Manual.` },
              { status: 503 }
            );
          }
        } else {
           return NextResponse.json(
            { error: "Koneksi ke AI Vision gagal. Silakan coba lagi atau gunakan Input Manual." },
            { status: 500 }
          );
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
      catatan = (geminiResult.catatan || "") + (visionSource === "qwen" ? " [Dianalisis oleh Qwen — Gemini sedang tidak tersedia]" : "");
    } else {
      return NextResponse.json({ error: "Gambar atau input manual diperlukan" }, { status: 400 });
    }

    // ── Step 2: Enrich with TKPI database (instant) ──
    const enrichedItems = enrichWithTkpi(geminiItems);

    // ── Step 3: Calculate totals (instant) ──
    const totals = calculateTotals(enrichedItems);

    // ── Step 4: Calculate MBG score (instant) ──
    const mbgScore = calculateMbgScore(enrichedItems, totals);

    // ── Step 5: Category breakdown (instant) ──
    const categoryBreakdown = getCategoryBreakdown(enrichedItems);

    // ── Step 6: Local pricing estimation (instant — NO AI call) ──
    const pricing = estimateLocalPricing(enrichedItems);

    const scanId = generateScanId();

    const result = {
      id: scanId,
      timestamp: new Date().toISOString(),
      items: enrichedItems,
      totals,
      mbgScore,
      categoryBreakdown,
      pricing,
      aiAnalysis: null, // Loaded lazily by the result page via /api/explain
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
