import { NextResponse } from "next/server";
import { analyzeWithOllama } from "@/lib/ollama";

export const maxDuration = 120;

/**
 * Lazy AI explanation endpoint.
 * Called asynchronously by the result page AFTER initial results are displayed.
 * This keeps the main scan pipeline fast (~5s).
 */
export async function POST(request) {
  try {
    const { items, totals, mbgScore } = await request.json();

    if (!items || !totals || !mbgScore) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    let aiAnalysis;
    try {
      // 1. Coba pakai Gemini Text (Sangat cepat ~1-2 detik)
      const { analyzeExplanationWithGemini } = await import("@/lib/gemini");
      aiAnalysis = await analyzeExplanationWithGemini(items, totals, mbgScore);
    } catch (geminiErr) {
      console.log("Gemini text explanation failed, falling back to Ollama...", geminiErr.message);
      // 2. Jika Gemini gagal (misal limit 429), fallback ke Ollama (bisa butuh 10-30 detik)
      try {
        aiAnalysis = await analyzeWithOllama(items, totals, mbgScore);
      } catch (ollamaErr) {
        console.error("Ollama explanation fallback failed:", ollamaErr.message);
        throw new Error("Kedua AI (Gemini & Ollama) gagal merespons");
      }
    }

    return NextResponse.json({
      penjelasan_skor: aiAnalysis?.penjelasan_skor || "",
      penjelasan_nutrisi: aiAnalysis?.penjelasan_nutrisi || "",
      rekomendasi: aiAnalysis?.rekomendasi || [],
    });
  } catch (error) {
    console.error("Explain API error:", error);
    return NextResponse.json(
      { error: "Gagal menganalisis. AI sedang tidak tersedia." },
      { status: 500 }
    );
  }
}
