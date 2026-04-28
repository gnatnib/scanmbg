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

    const aiAnalysis = await analyzeWithOllama(items, totals, mbgScore);

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
