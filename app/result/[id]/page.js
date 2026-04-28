"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MbgScoreGauge from "@/components/MbgScoreGauge";
import { MacroPieChart, ProteinBarChart, NutritionRadarChart, MacroStackedBarChart } from "@/components/NutritionChart";
import { Beef, Droplets, Wheat as WheatIcon } from "lucide-react";
import BreakdownTable from "@/components/BreakdownTable";
import ShareModal from "@/components/ShareModal";
import { FoodIconBadge } from "@/lib/food-icons";
import {
  Flame, Share2, ArrowLeft,
  CheckCircle2, XCircle, Info, ChevronDown, ChevronUp,
  Banknote, Receipt, Sparkles, Lightbulb, MessageCircle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

function NutritionBar({ label, value, max, unit, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[11px] text-text-secondary text-right shrink-0">{label}</span>
      <div className="flex-1 nutrition-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="nutrition-bar-fill"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="w-14 text-[12px] font-semibold text-text tabular-nums shrink-0">
        {value.toFixed(1)}<span className="text-text-tertiary font-normal text-[10px]">{unit}</span>
      </span>
    </div>
  );
}

function AnimatedNum({ value, suffix = "", decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 1000;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setDisplay((1 - Math.pow(1 - p, 3)) * value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
}

export default function ResultPage() {
  const params = useParams();
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [showDetailCharts, setShowDetailCharts] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ── Lazy AI explanation state ──
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`scan_${params.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setResult(parsed);
      // If scan already had AI analysis (e.g. from older pipeline), use it
      if (parsed.aiAnalysis) setAiAnalysis(parsed.aiAnalysis);
    }
    const img = sessionStorage.getItem(`scan_image_${params.id}`);
    if (img) setImageUrl(img);
  }, [params.id]);

  // ── Lazy-load AI explanation in background ──
  useEffect(() => {
    if (!result || aiAnalysis || aiLoading) return;
    // If result already has aiAnalysis from the scan, skip
    if (result.aiAnalysis) return;

    setAiLoading(true);
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: result.items,
        totals: result.totals,
        mbgScore: result.mbgScore,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAiAnalysis(data);
        setAiLoading(false);
      })
      .catch(() => {
        setAiError("AI analisis tidak tersedia saat ini.");
        setAiLoading(false);
      });
  }, [result]);

  if (!result) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="card p-10 text-center max-w-sm">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-warning-light flex items-center justify-center">
              <Info className="h-6 w-6 text-warning" />
            </div>
            <h2 className="text-[16px] font-bold text-text mb-2">Hasil Tidak Ditemukan</h2>
            <p className="text-[12px] text-text-secondary mb-5">Sesi mungkin sudah kedaluwarsa.</p>
            <Link href="/" className="inline-flex rounded-2xl bg-primary px-6 py-2.5 text-[13px] font-semibold text-white">
              Scan Baru
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { items, totals, mbgScore, deskripsi, catatan, pricing } = result;

  return (
    <>
      <Header />
      <main className="min-h-screen px-4 pb-8">
        <div className="mx-auto max-w-lg pt-4">

          {/* Nav bar */}
          <motion.div {...fade(0)} className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-text transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              Bagikan
            </button>
          </motion.div>

          {/* Scanned image + Score card */}
          <motion.div {...fade(0.05)} className="card overflow-hidden mb-4">
            {imageUrl && (
              <div className="relative cursor-pointer group" onClick={() => setLightboxOpen(true)}>
                <img src={imageUrl} alt="Baki MBG" className="w-full h-48 object-cover transition-transform group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-medium bg-black/50 rounded-full px-3 py-1 backdrop-blur-sm">Klik untuk perbesar</span>
                </div>
                <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-sm">
                  <span className="text-[12px] font-bold" style={{ color: mbgScore.gradeColor }}>
                    ● {mbgScore.score}/10
                  </span>
                </div>
              </div>
            )}

            <div className="p-5">
              {deskripsi && (
                <h2 className="text-[16px] font-bold text-text leading-snug mb-4">{deskripsi}</h2>
              )}

              <div className="flex items-center justify-center py-2">
                <MbgScoreGauge
                  score={mbgScore.score}
                  grade={mbgScore.grade}
                  gradeLabel={mbgScore.gradeLabel}
                  gradeColor={mbgScore.gradeColor}
                />
              </div>
              <p className="text-center text-[11px] text-text-tertiary mt-1">
                Berdasarkan standar Kemenkes "Isi Piringku"
              </p>
            </div>
          </motion.div>

          {/* ── AI Analysis Explanation Card (lazy-loaded) ───────── */}
          <motion.div {...fade(0.1)} className="card p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-primary-light flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-text">Analisis AI</h3>
                <p className="text-[10px] text-text-tertiary">
                  {aiLoading ? "Memuat analisis…" : aiError ? "Tidak tersedia" : "Qwen AI Analysis"}
                </p>
              </div>
            </div>

            {aiLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-3 bg-bg-muted rounded-full w-full" />
                <div className="h-3 bg-bg-muted rounded-full w-5/6" />
                <div className="h-3 bg-bg-muted rounded-full w-4/6" />
                <div className="h-3 bg-bg-muted rounded-full w-full mt-4" />
                <div className="h-3 bg-bg-muted rounded-full w-3/4" />
                <p className="text-[11px] text-text-tertiary mt-2">AI sedang menganalisis menu Anda…</p>
              </div>
            )}

            {aiError && (
              <p className="text-[12px] text-text-tertiary">{aiError}</p>
            )}

            {aiAnalysis && (
              <>
                {/* Score explanation */}
                {aiAnalysis.penjelasan_skor && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageCircle className="h-3.5 w-3.5 text-primary" />
                      <p className="text-[12px] font-semibold text-text">Penjelasan Skor</p>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">
                      {aiAnalysis.penjelasan_skor}
                    </p>
                  </div>
                )}

                {/* Nutrition explanation */}
                {aiAnalysis.penjelasan_nutrisi && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-info" />
                      <p className="text-[12px] font-semibold text-text">Detail Nutrisi</p>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">
                      {aiAnalysis.penjelasan_nutrisi}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.rekomendasi && aiAnalysis.rekomendasi.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb className="h-3.5 w-3.5 text-warning" />
                      <p className="text-[12px] font-semibold text-text">Rekomendasi</p>
                    </div>
                    <div className="space-y-1.5">
                      {aiAnalysis.rekomendasi.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-xl bg-warning-light/50 p-2.5">
                          <span className="text-[11px] font-bold text-warning mt-0.5">{i + 1}.</span>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Macro summary cards */}
          <motion.div {...fade(0.15)} className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              { label: "Protein", value: totals.protein, unit: "g", Icon: Beef, color: "#3B82F6", bg: "#EFF6FF" },
              { label: "Karbo", value: totals.karbohidrat, unit: "g", Icon: WheatIcon, color: "#F59E0B", bg: "#FFFBEB" },
              { label: "Lemak", value: totals.lemak, unit: "g", Icon: Droplets, color: "#EF4444", bg: "#FEF2F2" },
            ].map((stat, i) => (
              <div key={i} className="card p-4 text-center">
                <div className="mx-auto mb-1.5 h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                  <stat.Icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
                <span className="text-[18px] font-bold tabular-nums text-text block">
                  <AnimatedNum value={stat.value} decimals={1} />
                  <span className="text-[11px] font-normal text-text-tertiary">{stat.unit}</span>
                </span>
                <span className="text-[11px] text-text-secondary">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Calories card */}
          <motion.div {...fade(0.2)} className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-warning-light flex items-center justify-center">
                  <Flame className="h-4 w-4 text-warning" />
                </div>
                <span className="text-[13px] font-semibold text-text">Kalori Total</span>
              </div>
              <span className="text-[20px] font-bold text-text tabular-nums">
                <AnimatedNum value={totals.energi} decimals={0} />
                <span className="text-[12px] font-normal text-text-tertiary ml-0.5">kcal</span>
              </span>
            </div>
            <div className="nutrition-bar h-2 rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totals.energi / 700) * 100)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="nutrition-bar-fill h-2 rounded-full"
                style={{
                  backgroundColor:
                    totals.energi >= 400 && totals.energi <= 600 ? "#22C55E"
                    : totals.energi >= 300 && totals.energi <= 700 ? "#F59E0B"
                    : "#EF4444"
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-text-tertiary">
              <span>0</span>
              <span className="text-primary font-medium">Target: 400-600 kcal</span>
              <span>700</span>
            </div>
          </motion.div>

          {/* Nutrisi Lengkap — bars */}
          <motion.div {...fade(0.25)} className="card p-5 mb-4">
            <h3 className="text-[14px] font-bold text-text mb-4">Komposisi Gizi</h3>
            <div className="space-y-3">
              <NutritionBar label="Protein" value={totals.protein} max={30} unit="g" color="#3B82F6" />
              <NutritionBar label="Karbo" value={totals.karbohidrat} max={100} unit="g" color="#F59E0B" />
              <NutritionBar label="Lemak" value={totals.lemak} max={25} unit="g" color="#EF4444" />
              <NutritionBar label="Serat" value={totals.serat} max={8} unit="g" color="#8B5CF6" />
              <NutritionBar label="Kalsium" value={totals.kalsium} max={300} unit="mg" color="#06B6D4" />
              <NutritionBar label="Zat Besi" value={totals.zat_besi} max={6} unit="mg" color="#D97706" />
              <NutritionBar label="Vit. A" value={totals.vitamin_a} max={300} unit="mcg" color="#F97316" />
              <NutritionBar label="Vit. C" value={totals.vitamin_c} max={30} unit="mg" color="#10B981" />
            </div>
          </motion.div>

          {/* Detected items list — with Lucide icons */}
          <motion.div {...fade(0.3)} className="card p-5 mb-4">
            <h3 className="text-[14px] font-bold text-text mb-3">
              Makanan Terdeteksi <span className="text-text-tertiary font-normal">({items.length})</span>
            </h3>
            <div className="space-y-2.5">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl bg-bg-subtle p-3"
                >
                  <FoodIconBadge foodName={item.nama} kategori={item.kategori} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text truncate">{item.nama}</div>
                    <div className="text-[11px] text-text-tertiary">{item.porsi_gram}g · {item.nutrisi_porsi.energi?.toFixed(0)} kcal</div>
                  </div>
                  <div className="flex gap-2 text-[10px] shrink-0">
                    <span className="text-protein font-semibold">P:{item.nutrisi_porsi.protein?.toFixed(1)}</span>
                    <span className="text-fat font-semibold">L:{item.nutrisi_porsi.lemak?.toFixed(1)}</span>
                    <span className="text-carbs font-semibold">K:{item.nutrisi_porsi.karbohidrat?.toFixed(1)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Kemenkes Comparison */}
          <motion.div {...fade(0.35)} className="card p-5 mb-4">
            <h3 className="text-[14px] font-bold text-text mb-3">Standar Kemenkes</h3>
            <div className="space-y-2">
              {mbgScore.kemenkesComparison.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                    item.status === "pass" ? "bg-primary-light" : "bg-danger-light"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-danger" />
                    )}
                    <span className="text-[12px] text-text">{item.kriteria}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className={`font-semibold ${item.status === "pass" ? "text-primary-dark" : "text-danger"}`}>
                      {item.nilai}
                    </span>
                    <span className="text-text-tertiary">/ {item.standar}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pricing Estimation */}
          {pricing && (
            <motion.div {...fade(0.38)} className="card p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-xl bg-primary-light flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-text">Estimasi Harga</h3>
                  <p className="text-[10px] text-text-tertiary">Database harga pasar tradisional 2024-2025</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {pricing.items?.map((pi, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] py-1.5 border-b border-border-light last:border-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-text">{pi.nama}</span>
                      <span className="text-text-tertiary ml-1">({pi.gram_digunakan}g)</span>
                      {pi.sumber_harga && <span className="text-[9px] text-text-tertiary ml-1">· {pi.sumber_harga}</span>}
                    </div>
                    <span className="text-text font-semibold tabular-nums">Rp {pi.harga_porsi?.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                {pricing.biaya_bumbu_minyak > 0 && (
                  <div className="flex items-center justify-between text-[12px] py-1.5 border-b border-border-light">
                    <span className="text-text-secondary">Bumbu & minyak</span>
                    <span className="text-text font-semibold tabular-nums">Rp {pricing.biaya_bumbu_minyak?.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {pricing.biaya_overhead > 0 && (
                  <div className="flex items-center justify-between text-[12px] py-1.5 border-b border-border-light">
                    <span className="text-text-secondary">Overhead (gas, tenaga)</span>
                    <span className="text-text font-semibold tabular-nums">Rp {pricing.biaya_overhead?.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-bg-subtle p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-text">Total Estimasi</span>
                  <span className="text-[18px] font-bold text-text tabular-nums">Rp {pricing.total_estimasi?.toLocaleString('id-ID')}</span>
                </div>
                <div className="nutrition-bar h-2 rounded-full mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((pricing.total_estimasi || 0) / 15000) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="nutrition-bar-fill h-2 rounded-full"
                    style={{ backgroundColor: (pricing.selisih || 0) >= 0 ? '#22C55E' : '#EF4444' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">Budget MBG: Rp 15.000</span>
                  <span className={`font-semibold ${(pricing.selisih || 0) >= 0 ? 'text-primary' : 'text-danger'}`}>
                    {(pricing.selisih || 0) >= 0 ? `Sisa Rp ${pricing.selisih?.toLocaleString('id-ID')}` : `Lebih Rp ${Math.abs(pricing.selisih || 0).toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>

              {pricing.penilaian && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary-light/50 p-3">
                  <Receipt className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] text-text-secondary leading-relaxed">{pricing.penilaian}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Expandable Charts Section */}
          <motion.div {...fade(0.4)} className="card overflow-hidden mb-4">
            <button
              onClick={() => setShowDetailCharts(!showDetailCharts)}
              className="flex w-full items-center justify-between p-5 hover:bg-bg-subtle/50 transition-colors"
            >
              <h3 className="text-[14px] font-bold text-text">Grafik Detail</h3>
              {showDetailCharts ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
            </button>

            {showDetailCharts && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-5 pb-5 space-y-6">
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-3">Rasio Makronutrien</p>
                  <MacroPieChart totals={totals} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-3">Makronutrien per Item</p>
                  <MacroStackedBarChart items={items} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-2">Profil Gizi vs Ideal</p>
                  <NutritionRadarChart totals={totals} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-text-secondary mb-3">Protein per Item</p>
                  <ProteinBarChart items={items} />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Full breakdown table */}
          <motion.div {...fade(0.45)} className="card p-5 mb-4 overflow-hidden">
            <h3 className="text-[14px] font-bold text-text mb-3">Tabel Nutrisi Lengkap</h3>
            <BreakdownTable items={items} totals={totals} />
          </motion.div>

          {/* AI notes */}
          {catatan && (
            <motion.div {...fade(0.5)} className="card-flat p-4 mb-4">
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-text-tertiary mt-0.5 shrink-0" />
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <b className="text-text">Catatan AI:</b> {catatan}
                </p>
              </div>
            </motion.div>
          )}

          {/* Bottom actions */}
          <motion.div {...fade(0.55)} className="flex gap-2.5 mt-6">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-[13px] font-semibold text-text-secondary transition-all hover:bg-bg-subtle"
            >
              Scan Lagi
            </Link>
            <button
              onClick={() => setShareOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[13px] font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary-dark"
            >
              <Share2 className="h-4 w-4" />
              Bagikan
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
      <ShareModal result={result} imageUrl={imageUrl} isOpen={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Image Lightbox */}
      {lightboxOpen && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            src={imageUrl}
            alt="Baki MBG — perbesar"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
          >
            <span className="text-lg">✕</span>
          </button>
        </motion.div>
      )}
    </>
  );
}
