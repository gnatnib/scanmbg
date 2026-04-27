import tkpiData from "@/data/tkpi.json";

/**
 * Attempts to find a matching food item in the TKPI database.
 * Uses fuzzy matching via key normalization and partial matching.
 */
export function findTkpiMatch(key) {
  const normalized = key.toLowerCase().replace(/[\s-]/g, "_").replace(/[^a-z0-9_]/g, "");

  // Direct match
  if (tkpiData[normalized]) {
    return { ...tkpiData[normalized], source: "tkpi", matchKey: normalized };
  }

  // Try partial matching
  const keys = Object.keys(tkpiData);
  
  // Check if any TKPI key is contained in the input or vice versa
  for (const tkpiKey of keys) {
    if (normalized.includes(tkpiKey) || tkpiKey.includes(normalized)) {
      return { ...tkpiData[tkpiKey], source: "tkpi", matchKey: tkpiKey };
    }
  }

  // Try matching individual words
  const words = normalized.split("_").filter(w => w.length > 2);
  let bestMatch = null;
  let bestScore = 0;

  for (const tkpiKey of keys) {
    const tkpiWords = tkpiKey.split("_");
    let score = 0;
    for (const word of words) {
      if (tkpiWords.some(tw => tw.includes(word) || word.includes(tw))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tkpiKey;
    }
  }

  if (bestMatch && bestScore >= 1) {
    return { ...tkpiData[bestMatch], source: "tkpi_fuzzy", matchKey: bestMatch };
  }

  return null;
}

/**
 * Calculate nutrition for a given food item and portion size.
 * @param {object} nutrisiPer100g - Nutrition values per 100g
 * @param {number} portionGrams - Portion size in grams
 * @returns {object} Calculated nutrition values for the portion
 */
export function calculatePortion(nutrisiPer100g, portionGrams) {
  const factor = portionGrams / 100;
  const result = {};
  for (const [key, value] of Object.entries(nutrisiPer100g)) {
    result[key] = Math.round(value * factor * 10) / 10;
  }
  return result;
}

/**
 * Process Gemini results against TKPI database.
 * Returns enriched items with TKPI data where available,
 * falling back to Gemini estimates with an "estimasi_ai" flag.
 */
export function enrichWithTkpi(geminiItems) {
  return geminiItems.map((item) => {
    const tkpiMatch = findTkpiMatch(item.key);

    let nutrisiPer100g;
    let source;

    if (tkpiMatch) {
      nutrisiPer100g = tkpiMatch.per_100g;
      source = tkpiMatch.source;
    } else if (item.nutrisi_per_100g && typeof item.nutrisi_per_100g === "object") {
      // Fallback to Gemini's own estimate (if provided)
      nutrisiPer100g = item.nutrisi_per_100g;
      source = "estimasi_ai";
    } else {
      // No nutrition data available — use zero placeholder
      // This will be filled by Ollama later if available
      nutrisiPer100g = {
        energi: 0, protein: 0, lemak: 0, karbohidrat: 0,
        serat: 0, kalsium: 0, zat_besi: 0, vitamin_a: 0, vitamin_c: 0,
      };
      source = "perlu_estimasi";
    }

    const portionNutrition = calculatePortion(nutrisiPer100g, item.estimasi_gram);

    return {
      ...item,
      nutrisi_per_100g: nutrisiPer100g,
      nutrisi_porsi: portionNutrition,
      porsi_gram: item.estimasi_gram,
      sumber_data: source,
      tkpi_nama: tkpiMatch?.nama || null,
    };
  });
}

/**
 * Calculate total nutrition from enriched items.
 */
export function calculateTotals(enrichedItems) {
  const totals = {
    energi: 0,
    protein: 0,
    lemak: 0,
    karbohidrat: 0,
    serat: 0,
    kalsium: 0,
    zat_besi: 0,
    vitamin_a: 0,
    vitamin_c: 0,
  };

  for (const item of enrichedItems) {
    for (const key of Object.keys(totals)) {
      totals[key] += item.nutrisi_porsi[key] || 0;
    }
  }

  // Round all totals
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 10) / 10;
  }

  return totals;
}

/**
 * Get category breakdown (for charts).
 */
export function getCategoryBreakdown(enrichedItems) {
  const categories = {};

  for (const item of enrichedItems) {
    if (!categories[item.kategori]) {
      categories[item.kategori] = {
        items: [],
        totalProtein: 0,
        totalEnergi: 0,
      };
    }
    categories[item.kategori].items.push(item);
    categories[item.kategori].totalProtein += item.nutrisi_porsi.protein || 0;
    categories[item.kategori].totalEnergi += item.nutrisi_porsi.energi || 0;
  }

  return categories;
}
