import { NextResponse } from "next/server";
import { analyzeWithOllama } from "@/lib/ollama";

export const maxDuration = 120;

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

    // 1. Try Gemini Text (fast ~1-2s)
    try {
      const { analyzeExplanationWithGemini } = await import("@/lib/gemini");
      aiAnalysis = await analyzeExplanationWithGemini(items, totals, mbgScore);
    } catch (geminiErr) {
      console.log("Gemini explanation failed, trying Ollama...", geminiErr.message);
    }

    // 2. Try Ollama (fallback)
    if (!aiAnalysis) {
      try {
        aiAnalysis = await analyzeWithOllama(items, totals, mbgScore);
      } catch (ollamaErr) {
        console.error("All explanation providers failed:", ollamaErr.message);
        return NextResponse.json(
          { error: "AI analisis tidak tersedia saat ini.", penjelasan_skor: "", penjelasan_nutrisi: "", rekomendasi: [] },
          { status: 200 }
        );
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
