/**
 * Local Indonesian Market Price Database
 * Based on real pasar tradisional prices 2024-2025
 * Source: BPS (Badan Pusat Statistik), pantau harga pangan, field surveys
 *
 * All prices are Rp per kg (raw ingredient cost)
 */

const HARGA_BAHAN = {
  // ── Karbohidrat ──
  nasi_putih: { perKg: 14000, nama: "Beras putih" },
  nasi_merah: { perKg: 22000, nama: "Beras merah" },
  nasi_goreng: { perKg: 16000, nama: "Beras + bumbu" },
  nasi: { perKg: 14000, nama: "Beras putih" },
  beras: { perKg: 14000, nama: "Beras putih" },
  mie: { perKg: 18000, nama: "Mie kering" },
  mie_goreng: { perKg: 18000, nama: "Mie kering" },
  mie_kuah: { perKg: 18000, nama: "Mie kering" },
  roti: { perKg: 25000, nama: "Roti tawar" },
  roti_burger: { perKg: 30000, nama: "Roti burger" },
  burger: { perKg: 30000, nama: "Roti burger" },
  kentang: { perKg: 18000, nama: "Kentang" },
  singkong: { perKg: 8000, nama: "Singkong" },
  ubi: { perKg: 10000, nama: "Ubi jalar" },
  bubur: { perKg: 14000, nama: "Beras (bubur)" },
  lontong: { perKg: 14000, nama: "Beras (lontong)" },
  perkedel: { perKg: 20000, nama: "Kentang + bumbu" },

  // ── Protein Hewani ──
  ayam: { perKg: 38000, nama: "Ayam broiler" },
  ayam_goreng: { perKg: 38000, nama: "Ayam broiler" },
  ayam_bakar: { perKg: 38000, nama: "Ayam broiler" },
  daging_ayam: { perKg: 38000, nama: "Ayam broiler" },
  daging_sapi: { perKg: 130000, nama: "Daging sapi" },
  sapi: { perKg: 130000, nama: "Daging sapi" },
  rendang: { perKg: 130000, nama: "Daging sapi" },
  telur: { perKg: 28000, nama: "Telur ayam" },
  telur_ayam: { perKg: 28000, nama: "Telur ayam" },
  telur_dadar: { perKg: 28000, nama: "Telur ayam" },
  telur_rebus: { perKg: 28000, nama: "Telur ayam" },
  telur_ceplok: { perKg: 28000, nama: "Telur ayam" },
  ikan: { perKg: 35000, nama: "Ikan segar" },
  ikan_goreng: { perKg: 35000, nama: "Ikan segar" },
  ikan_bakar: { perKg: 35000, nama: "Ikan segar" },
  ikan_bandeng: { perKg: 32000, nama: "Ikan bandeng" },
  ikan_lele: { perKg: 28000, nama: "Ikan lele" },
  ikan_tongkol: { perKg: 30000, nama: "Ikan tongkol" },
  ikan_teri: { perKg: 80000, nama: "Ikan teri" },
  udang: { perKg: 80000, nama: "Udang" },
  nugget: { perKg: 55000, nama: "Nugget ayam" },
  bakso: { perKg: 50000, nama: "Bakso sapi" },
  sosis: { perKg: 45000, nama: "Sosis ayam" },
  kornet: { perKg: 60000, nama: "Kornet" },
  abon: { perKg: 120000, nama: "Abon sapi" },
  kerupuk_ikan: { perKg: 45000, nama: "Kerupuk ikan" },
  kerupuk: { perKg: 30000, nama: "Kerupuk" },
  susu: { perKg: 16000, nama: "Susu UHT" }, // per liter

  // ── Protein Nabati ──
  tempe: { perKg: 18000, nama: "Tempe" },
  tempe_goreng: { perKg: 18000, nama: "Tempe" },
  tempe_orek: { perKg: 18000, nama: "Tempe" },
  tahu: { perKg: 14000, nama: "Tahu" },
  tahu_goreng: { perKg: 14000, nama: "Tahu" },
  kacang_tanah: { perKg: 30000, nama: "Kacang tanah" },
  kacang_hijau: { perKg: 25000, nama: "Kacang hijau" },
  kacang_merah: { perKg: 28000, nama: "Kacang merah" },
  oncom: { perKg: 16000, nama: "Oncom" },

  // ── Sayuran ──
  kangkung: { perKg: 8000, nama: "Kangkung" },
  bayam: { perKg: 10000, nama: "Bayam" },
  wortel: { perKg: 12000, nama: "Wortel" },
  buncis: { perKg: 12000, nama: "Buncis" },
  kol: { perKg: 8000, nama: "Kol/kubis" },
  kubis: { perKg: 8000, nama: "Kol/kubis" },
  sawi: { perKg: 10000, nama: "Sawi hijau" },
  sawi_hijau: { perKg: 10000, nama: "Sawi hijau" },
  tauge: { perKg: 10000, nama: "Tauge" },
  terong: { perKg: 10000, nama: "Terong" },
  labu_siam: { perKg: 8000, nama: "Labu siam" },
  timun: { perKg: 8000, nama: "Mentimun" },
  mentimun: { perKg: 8000, nama: "Mentimun" },
  tomat: { perKg: 14000, nama: "Tomat" },
  selada: { perKg: 15000, nama: "Selada" },
  brokoli: { perKg: 25000, nama: "Brokoli" },
  jagung: { perKg: 10000, nama: "Jagung" },
  sayur: { perKg: 10000, nama: "Sayur campuran" },
  sayur_sop: { perKg: 12000, nama: "Sayur sop" },
  sayur_asem: { perKg: 10000, nama: "Sayur asem" },
  capcay: { perKg: 12000, nama: "Sayur capcay" },

  // ── Buah ──
  pisang: { perKg: 12000, nama: "Pisang" },
  jeruk: { perKg: 18000, nama: "Jeruk" },
  apel: { perKg: 30000, nama: "Apel" },
  pepaya: { perKg: 10000, nama: "Pepaya" },
  semangka: { perKg: 8000, nama: "Semangka" },
  melon: { perKg: 12000, nama: "Melon" },
  buah_naga: { perKg: 25000, nama: "Buah naga" },
  mangga: { perKg: 18000, nama: "Mangga" },
  buah: { perKg: 15000, nama: "Buah campuran" },
  pir: { perKg: 28000, nama: "Pir" },

  // ── Lainnya / Condiments ──
  sambal: { perKg: 20000, nama: "Cabai merah" },
  kecap: { perKg: 15000, nama: "Kecap manis" },
  saos_tomat: { perKg: 12000, nama: "Saus tomat" },
  keju: { perKg: 90000, nama: "Keju" },
  mentega: { perKg: 40000, nama: "Mentega" },
};

// Default overhead costs
const BIAYA_BUMBU_MINYAK = 1500; // Rp per porsi
const BIAYA_OVERHEAD = 2000;     // Rp per porsi (gas, tenaga kerja, kemasan)
const BUDGET_MBG = 15000;        // Rp per porsi

/**
 * Find the best matching price for a food item.
 * Uses fuzzy matching against the price database keys.
 */
function findPrice(key, nama) {
  const normalized = key.toLowerCase().replace(/[\s-]/g, "_").replace(/[^a-z0-9_]/g, "");

  // Direct match
  if (HARGA_BAHAN[normalized]) return HARGA_BAHAN[normalized];

  // Try cleaned nama
  const namaNorm = (nama || "").toLowerCase().replace(/[\s-]/g, "_").replace(/[^a-z0-9_]/g, "");
  if (HARGA_BAHAN[namaNorm]) return HARGA_BAHAN[namaNorm];

  // Partial match: check if any key is contained in the name or vice versa
  for (const [dbKey, data] of Object.entries(HARGA_BAHAN)) {
    if (normalized.includes(dbKey) || dbKey.includes(normalized)) return data;
    if (namaNorm.includes(dbKey) || dbKey.includes(namaNorm)) return data;
  }

  // Word-level match
  const words = namaNorm.split("_").filter(w => w.length > 2);
  for (const word of words) {
    for (const [dbKey, data] of Object.entries(HARGA_BAHAN)) {
      if (dbKey.includes(word) || word.includes(dbKey)) return data;
    }
  }

  // Fallback by category
  return null;
}

/**
 * Category-based fallback prices per kg
 */
const FALLBACK_PRICES = {
  protein_hewani: 40000,
  protein_nabati: 16000,
  karbohidrat: 14000,
  sayur: 10000,
  buah: 15000,
  lainnya: 20000,
};

/**
 * Estimate pricing for all enriched food items using local market data.
 * No AI calls — purely database lookup.
 */
export function estimateLocalPricing(enrichedItems) {
  const pricedItems = enrichedItems.map(item => {
    const match = findPrice(item.key || "", item.nama);
    const perKg = match ? match.perKg : (FALLBACK_PRICES[item.kategori] || 20000);
    const gramUsed = item.porsi_gram || 100;
    const hargaPorsi = Math.round((perKg / 1000) * gramUsed);

    return {
      nama: item.nama,
      harga_bahan_per_kg: perKg,
      sumber_harga: match ? match.nama : `Estimasi ${item.kategori}`,
      gram_digunakan: gramUsed,
      harga_porsi: hargaPorsi,
    };
  });

  const totalBahan = pricedItems.reduce((sum, i) => sum + i.harga_porsi, 0);
  const totalEstimasi = totalBahan + BIAYA_BUMBU_MINYAK + BIAYA_OVERHEAD;
  const selisih = BUDGET_MBG - totalEstimasi;

  let penilaian;
  if (totalEstimasi <= BUDGET_MBG * 0.7) {
    penilaian = `Biaya bahan sangat rendah (Rp ${totalEstimasi.toLocaleString("id-ID")} dari budget Rp 15.000). Menu ini bisa ditingkatkan kualitasnya tanpa melebihi anggaran.`;
  } else if (totalEstimasi <= BUDGET_MBG) {
    penilaian = `Biaya bahan wajar dan masih dalam anggaran MBG Rp 15.000. Sisa Rp ${selisih.toLocaleString("id-ID")} bisa dialokasikan untuk peningkatan gizi.`;
  } else if (totalEstimasi <= BUDGET_MBG * 1.3) {
    penilaian = `Biaya bahan sedikit melebihi anggaran MBG (surplus Rp ${Math.abs(selisih).toLocaleString("id-ID")}). Masih realistis jika ada efisiensi skala.`;
  } else {
    penilaian = `Biaya bahan melebihi anggaran MBG secara signifikan (surplus Rp ${Math.abs(selisih).toLocaleString("id-ID")}). Perlu subsitusi bahan yang lebih ekonomis.`;
  }

  return {
    items: pricedItems,
    biaya_bumbu_minyak: BIAYA_BUMBU_MINYAK,
    biaya_overhead: BIAYA_OVERHEAD,
    total_bahan: totalBahan,
    total_estimasi: totalEstimasi,
    budget_mbg: BUDGET_MBG,
    selisih,
    penilaian,
  };
}
