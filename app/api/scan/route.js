import { NextResponse } from "next/server";
import { analyzeFoodTray } from "@/lib/gemini";
import { enrichWithTkpi, calculateTotals, getCategoryBreakdown } from "@/lib/nutrition-db";
import { calculateMbgScore } from "@/lib/scoring";
import { estimateLocalPricing } from "@/lib/pricing-db";
import { estimateCustomNutrition, analyzeFoodTrayWithOllama } from "@/lib/ollama";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, mimeType, manualItems } = body;

    let detectedItems;
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

      detectedItems = knownItems;
      deskripsi = buildAutoDescription(knownItems);

    } else if (image) {
      // ── Vision scan mode ──
      const visionResult = await scanWithVisionFallback(image, mimeType || "image/jpeg");

      if (visionResult.error) {
        return NextResponse.json(
          { error: visionResult.error },
          { status: visionResult.status || 503 }
        );
      }

      if (!visionResult.items || visionResult.items.length === 0) {
        return NextResponse.json(
          { error: "Tidak dapat mendeteksi makanan dalam gambar. Coba foto yang lebih jelas." },
          { status: 422 }
        );
      }

      detectedItems = visionResult.items;
      deskripsi = visionResult.deskripsi_menu || "";
      catatan = visionResult.catatan || "";

    } else {
      return NextResponse.json({ error: "Gambar atau input manual diperlukan" }, { status: 400 });
    }

    // ── Enrich with TKPI database (instant) ──
    const enrichedItems = enrichWithTkpi(detectedItems);

    // ── Calculate totals (instant) ──
    const totals = calculateTotals(enrichedItems);

    // ── Calculate MBG score (instant) ──
    const mbgScore = calculateMbgScore(enrichedItems, totals);

    // ── Category breakdown (instant) ──
    const categoryBreakdown = getCategoryBreakdown(enrichedItems);

    // ── Local pricing estimation (instant — NO AI call) ──
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
      aiAnalysis: null,
      deskripsi: deskripsi || buildAutoDescription(enrichedItems),
      catatan,
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

/**
 * Vision fallback chain: Gemini → OpenRouter → error
 * Each provider has its own daily quota, so chaining them
 * effectively multiplies available free scans.
 */
async function scanWithVisionFallback(imageBase64, mimeType) {
  const errors = [];

  // ── 1. Try Gemini (free tier: ~20/day) ──
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    try {
      const result = await analyzeFoodTray(imageBase64, mimeType);
      console.log("Vision: Gemini succeeded");
      return { ...result, source: "gemini" };
    } catch (err) {
      const msg = err.message || "";
      console.log(`[Vision] Gemini failed: ${msg.substring(0, 150)}`);
      errors.push(`Gemini: ${msg.substring(0, 80)}`);

      const isRetryable = msg.includes("429") || msg.includes("quota") ||
        msg.includes("RESOURCE_EXHAUSTED") || msg.includes("503") ||
        msg.includes("timeout") || msg.includes("DEADLINE_EXCEEDED") ||
        msg.includes("500");

      if (!isRetryable) {
        return { error: "Koneksi ke AI Vision gagal. Silakan coba lagi atau gunakan Input Manual.", status: 500 };
      }
    }
  }

  // ── 2. Try Ollama native vision (mistral-medium with images field) ──
  if (process.env.OLLAMA_API_KEY) {
    try {
      console.log("[Vision] Trying Ollama vision...");
      const result = await analyzeFoodTrayWithOllama(imageBase64, mimeType);
      console.log("Vision: Ollama succeeded");
      return { ...result, source: "ollama", catatan: (result.catatan || "") + " [Dianalisis oleh Mistral via Ollama]" };
    } catch (err) {
      const msg = err.message || "";
      console.log(`[Vision] Ollama failed: ${msg.substring(0, 150)}`);
      errors.push(`Ollama: ${msg.substring(0, 80)}`);
    }
  }

  // ── All vision providers failed ──
  console.log("[Vision] All providers failed. Errors:", errors);
  const allErrors = errors.join(" | ");
  const hasRateLimit = allErrors.includes("429") || allErrors.includes("quota") || allErrors.includes("RESOURCE_EXHAUSTED");
  const hasTimeout = allErrors.includes("timeout") || allErrors.includes("AbortError");
  const hasUnsupported = allErrors.includes("does not support image");

  if (hasRateLimit) {
    return {
      error: "Semua AI vision sedang sibuk (limit tercapai). Coba lagi dalam beberapa menit atau gunakan Input Manual.",
      status: 429,
    };
  }
  if (hasTimeout) {
    return {
      error: "AI sedang sibuk (timeout). Silakan coba lagi dalam beberapa detik.",
      status: 503,
    };
  }

  return {
    error: "AI vision tidak tersedia. Gunakan Input Manual untuk menganalisis menu MBG kamu.",
    status: 503,
  };
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
