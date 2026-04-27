/**
 * MBG Score Calculator (0-10)
 * Based on Kemenkes "Isi Piringku" standards for MBG program.
 *
 * Scoring criteria:
 * 1. Kalori 300-700 kcal (2 pts)
 * 2. Protein hewani >= 15g (2 pts)
 * 3. Protein nabati present (1 pt)
 * 4. Sayur present + variety (1.5 pts)
 * 5. Buah present (1 pt)
 * 6. Macro ratio balance (1.5 pts)
 * 7. Menu variety >= 4 items (1 pt)
 */

const KEMENKES_STANDARDS = {
  kalori_min: 300,
  kalori_ideal_min: 400,
  kalori_ideal_max: 600,
  kalori_max: 700,
  protein_hewani_min: 15, // grams
  protein_total_ideal: 20, // grams
  macro_carb_min: 0.50,
  macro_carb_max: 0.65,
  macro_protein_min: 0.10,
  macro_protein_max: 0.15,
  macro_fat_min: 0.20,
  macro_fat_max: 0.25,
};

export function calculateMbgScore(enrichedItems, totals) {
  const details = [];
  let totalScore = 0;

  // 1. Kalori score (max 2 pts)
  const kaloriScore = scoreKalori(totals.energi);
  totalScore += kaloriScore.score;
  details.push(kaloriScore);

  // 2. Protein hewani (max 2 pts)
  const proteinHewaniScore = scoreProteinHewani(enrichedItems);
  totalScore += proteinHewaniScore.score;
  details.push(proteinHewaniScore);

  // 3. Protein nabati (max 1 pt)
  const proteinNabatiScore = scoreProteinNabati(enrichedItems);
  totalScore += proteinNabatiScore.score;
  details.push(proteinNabatiScore);

  // 4. Sayur (max 1.5 pts)
  const sayurScore = scoreSayur(enrichedItems);
  totalScore += sayurScore.score;
  details.push(sayurScore);

  // 5. Buah (max 1 pt)
  const buahScore = scoreBuah(enrichedItems);
  totalScore += buahScore.score;
  details.push(buahScore);

  // 6. Macro balance (max 1.5 pts)
  const macroScore = scoreMacroBalance(totals);
  totalScore += macroScore.score;
  details.push(macroScore);

  // 7. Variety (max 1 pt)
  const varietyScore = scoreVariety(enrichedItems);
  totalScore += varietyScore.score;
  details.push(varietyScore);

  totalScore = Math.round(totalScore * 10) / 10;

  return {
    score: Math.min(10, totalScore),
    maxScore: 10,
    grade: getGrade(totalScore),
    gradeLabel: getGradeLabel(totalScore),
    gradeColor: getGradeColor(totalScore),
    details,
    kemenkesComparison: getKemenkesComparison(enrichedItems, totals),
  };
}

function scoreKalori(energi) {
  let score = 0;
  const { kalori_min, kalori_ideal_min, kalori_ideal_max, kalori_max } = KEMENKES_STANDARDS;

  if (energi >= kalori_ideal_min && energi <= kalori_ideal_max) {
    score = 2;
  } else if (energi >= kalori_min && energi <= kalori_max) {
    if (energi < kalori_ideal_min) {
      score = 1 + (energi - kalori_min) / (kalori_ideal_min - kalori_min);
    } else {
      score = 1 + (kalori_max - energi) / (kalori_max - kalori_ideal_max);
    }
  } else if (energi > 0) {
    score = Math.max(0, 0.5 - Math.abs(energi - 500) / 1000);
  }

  return {
    kriteria: "Kalori",
    score: Math.round(score * 10) / 10,
    maxScore: 2,
    nilai: `${Math.round(energi)} kcal`,
    standar: `${kalori_ideal_min}-${kalori_ideal_max} kcal`,
    status: score >= 1.5 ? "baik" : score >= 1 ? "cukup" : "kurang",
  };
}

function scoreProteinHewani(items) {
  const hewaniItems = items.filter((i) => i.kategori === "protein_hewani");
  const totalProtein = hewaniItems.reduce((sum, i) => sum + (i.nutrisi_porsi.protein || 0), 0);

  let score = Math.min(2, (totalProtein / KEMENKES_STANDARDS.protein_hewani_min) * 2);

  return {
    kriteria: "Protein Hewani",
    score: Math.round(score * 10) / 10,
    maxScore: 2,
    nilai: `${Math.round(totalProtein * 10) / 10}g`,
    standar: `≥${KEMENKES_STANDARDS.protein_hewani_min}g`,
    status: score >= 1.5 ? "baik" : score >= 1 ? "cukup" : "kurang",
    items: hewaniItems.map((i) => i.nama),
  };
}

function scoreProteinNabati(items) {
  const nabatiItems = items.filter((i) => i.kategori === "protein_nabati");
  const hasNabati = nabatiItems.length > 0;

  return {
    kriteria: "Protein Nabati",
    score: hasNabati ? 1 : 0,
    maxScore: 1,
    nilai: hasNabati ? `Ada (${nabatiItems.map((i) => i.nama).join(", ")})` : "Tidak ada",
    standar: "Harus ada (tempe/tahu/kacang)",
    status: hasNabati ? "baik" : "kurang",
    items: nabatiItems.map((i) => i.nama),
  };
}

function scoreSayur(items) {
  const sayurItems = items.filter((i) => i.kategori === "sayur");
  let score = 0;

  if (sayurItems.length > 0) {
    score = 1; // Base score for having vegetables
    if (sayurItems.length >= 2) {
      score = 1.5; // Bonus for variety
    }
  }

  return {
    kriteria: "Sayuran",
    score,
    maxScore: 1.5,
    nilai: sayurItems.length > 0 ? `${sayurItems.length} jenis` : "Tidak ada",
    standar: "Minimal 1 jenis sayuran",
    status: score >= 1 ? "baik" : "kurang",
    items: sayurItems.map((i) => i.nama),
  };
}

function scoreBuah(items) {
  const buahItems = items.filter((i) => i.kategori === "buah");
  const hasBuah = buahItems.length > 0;

  return {
    kriteria: "Buah",
    score: hasBuah ? 1 : 0,
    maxScore: 1,
    nilai: hasBuah ? `Ada (${buahItems.map((i) => i.nama).join(", ")})` : "Tidak ada",
    standar: "Harus ada buah pelengkap",
    status: hasBuah ? "baik" : "kurang",
    items: buahItems.map((i) => i.nama),
  };
}

function scoreMacroBalance(totals) {
  const totalCal = totals.energi || 1;
  const carbCal = (totals.karbohidrat || 0) * 4;
  const proteinCal = (totals.protein || 0) * 4;
  const fatCal = (totals.lemak || 0) * 9;
  const totalMacroCal = carbCal + proteinCal + fatCal || 1;

  const carbRatio = carbCal / totalMacroCal;
  const proteinRatio = proteinCal / totalMacroCal;
  const fatRatio = fatCal / totalMacroCal;

  let score = 0;
  const { macro_carb_min, macro_carb_max, macro_protein_min, macro_protein_max, macro_fat_min, macro_fat_max } =
    KEMENKES_STANDARDS;

  // Score each macro ratio (0.5 each = 1.5 total)
  if (carbRatio >= macro_carb_min && carbRatio <= macro_carb_max) score += 0.5;
  else if (carbRatio >= macro_carb_min - 0.1 && carbRatio <= macro_carb_max + 0.1) score += 0.25;

  if (proteinRatio >= macro_protein_min && proteinRatio <= macro_protein_max) score += 0.5;
  else if (proteinRatio >= macro_protein_min - 0.05 && proteinRatio <= macro_protein_max + 0.05) score += 0.25;

  if (fatRatio >= macro_fat_min && fatRatio <= macro_fat_max) score += 0.5;
  else if (fatRatio >= macro_fat_min - 0.1 && fatRatio <= macro_fat_max + 0.1) score += 0.25;

  return {
    kriteria: "Keseimbangan Makro",
    score: Math.round(score * 10) / 10,
    maxScore: 1.5,
    nilai: `K:${Math.round(carbRatio * 100)}% P:${Math.round(proteinRatio * 100)}% L:${Math.round(fatRatio * 100)}%`,
    standar: `K:50-65% P:10-15% L:20-25%`,
    status: score >= 1 ? "baik" : score >= 0.5 ? "cukup" : "kurang",
    ratios: { carb: carbRatio, protein: proteinRatio, fat: fatRatio },
  };
}

function scoreVariety(items) {
  const uniqueCategories = new Set(items.map((i) => i.kategori));
  const uniqueItems = items.length;

  let score = 0;
  if (uniqueItems >= 5) score = 1;
  else if (uniqueItems >= 4) score = 0.75;
  else if (uniqueItems >= 3) score = 0.5;
  else if (uniqueItems >= 2) score = 0.25;

  return {
    kriteria: "Variasi Menu",
    score,
    maxScore: 1,
    nilai: `${uniqueItems} item, ${uniqueCategories.size} kategori`,
    standar: "≥4 item berbeda",
    status: score >= 0.75 ? "baik" : score >= 0.5 ? "cukup" : "kurang",
  };
}

function getGrade(score) {
  if (score >= 8.5) return "A";
  if (score >= 7) return "B";
  if (score >= 5.5) return "C";
  if (score >= 4) return "D";
  return "E";
}

function getGradeLabel(score) {
  if (score >= 8.5) return "Sangat Baik";
  if (score >= 7) return "Baik";
  if (score >= 5.5) return "Cukup";
  if (score >= 4) return "Kurang";
  return "Sangat Kurang";
}

function getGradeColor(score) {
  if (score >= 8.5) return "#10B981";
  if (score >= 7) return "#22C55E";
  if (score >= 5.5) return "#EAB308";
  if (score >= 4) return "#F97316";
  return "#EF4444";
}

function getKemenkesComparison(items, totals) {
  const hewaniItems = items.filter((i) => i.kategori === "protein_hewani");
  const proteinHewani = hewaniItems.reduce((sum, i) => sum + (i.nutrisi_porsi.protein || 0), 0);
  const hasNabati = items.some((i) => i.kategori === "protein_nabati");
  const hasSayur = items.some((i) => i.kategori === "sayur");
  const hasBuah = items.some((i) => i.kategori === "buah");

  return [
    {
      kriteria: "Kalori per Porsi",
      nilai: `${Math.round(totals.energi)} kcal`,
      standar: "400-600 kcal",
      status: totals.energi >= 400 && totals.energi <= 600 ? "pass" : "fail",
    },
    {
      kriteria: "Protein Hewani",
      nilai: `${Math.round(proteinHewani * 10) / 10}g`,
      standar: "≥15g",
      status: proteinHewani >= 15 ? "pass" : "fail",
    },
    {
      kriteria: "Protein Nabati",
      nilai: hasNabati ? "Ada" : "Tidak ada",
      standar: "Wajib ada",
      status: hasNabati ? "pass" : "fail",
    },
    {
      kriteria: "Sayuran",
      nilai: hasSayur ? "Ada" : "Tidak ada",
      standar: "Wajib ada",
      status: hasSayur ? "pass" : "fail",
    },
    {
      kriteria: "Buah-buahan",
      nilai: hasBuah ? "Ada" : "Tidak ada",
      standar: "Wajib ada",
      status: hasBuah ? "pass" : "fail",
    },
    {
      kriteria: "Total Protein",
      nilai: `${Math.round(totals.protein * 10) / 10}g`,
      standar: "≥20g",
      status: totals.protein >= 20 ? "pass" : "fail",
    },
  ];
}

export { KEMENKES_STANDARDS };
