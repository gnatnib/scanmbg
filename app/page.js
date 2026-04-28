"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Camera from "@/components/Camera";
import ImageUploader from "@/components/ImageUploader";
import ManualInput from "@/components/ManualInput";
import {
  Camera as CameraIcon, Image as ImageIcon, PenLine,
  ScanLine, AlertCircle, ShieldCheck, Users, Banknote,
  ArrowRight, Utensils, BarChart3, Receipt, Eye, Sparkles,
  ChefHat, Target, TrendingUp,
} from "lucide-react";

/* ── Animated counter ────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{value.toLocaleString("id-ID")}{suffix}</>;
}

/* ── Analysis steps for progress animation ───────────── */
const ANALYSIS_STEPS = [
  { icon: Eye, label: "Mendeteksi makanan…", sublabel: "Gemini Vision AI" },
  { icon: Utensils, label: "Mengidentifikasi menu…", sublabel: "Database TKPI" },
  { icon: BarChart3, label: "Menghitung nutrisi…", sublabel: "Qwen 3.5 AI" },
  { icon: Banknote, label: "Estimasi harga…", sublabel: "Pasar tradisional" },
  { icon: ShieldCheck, label: "Menyiapkan hasil…", sublabel: "Standar Kemenkes" },
];

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState("upload");
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState(null);

  // Auto-advance step during analysis
  useEffect(() => {
    if (!isAnalyzing) { setAnalysisStep(0); return; }
    const interval = setInterval(() => {
      setAnalysisStep((s) => (s < ANALYSIS_STEPS.length - 1 ? s + 1 : s));
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleCapture = useCallback((imageData) => {
    setCapturedImage(imageData);
    setMode("upload");
  }, []);

  const handleImageSelect = useCallback((imageData) => {
    setCapturedImage(imageData);
  }, []);

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage.base64,
          mimeType: capturedImage.mimeType || "image/jpeg",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Terjadi kesalahan");

      sessionStorage.setItem(`scan_${data.id}`, JSON.stringify(data));
      if (capturedImage.dataUrl) {
        sessionStorage.setItem(`scan_image_${data.id}`, capturedImage.dataUrl);
      }
      router.push(`/result/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async (items) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualItems: items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Terjadi kesalahan");

      sessionStorage.setItem(`scan_${data.id}`, JSON.stringify(data));
      router.push(`/result/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setError(null);
  };

  const modes = [
    { key: "upload", label: "Foto", icon: ImageIcon },
    { key: "camera", label: "Kamera", icon: CameraIcon },
    { key: "manual", label: "Manual", icon: PenLine },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen px-4 pb-8">
        <div className="mx-auto max-w-lg">

          {/* ── Hero section ─────────────────────────── */}
          {!capturedImage && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-8 pb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-semibold text-primary tracking-wide uppercase">
                  Transparansi Gizi MBG
                </span>
              </div>
              <h1 className="text-[26px] font-extrabold text-text leading-[1.15] mb-2">
                Cek Gizi Menu{" "}
                <span className="text-primary">Makan Bergizi Gratis</span>
              </h1>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Scan foto baki atau input menu manual — AI menganalisis nutrisi, harga bahan, dan kesesuaian standar Kemenkes secara detail.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[
                  { value: 82, suffix: " jt", label: "Anak penerima", icon: Users },
                  { value: 15, suffix: "rb", label: "Budget/porsi", icon: Banknote },
                  { value: 600, suffix: "", label: "Target kcal", icon: Target },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="card-flat rounded-2xl p-3 text-center"
                  >
                    <stat.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                    <span className="text-[16px] font-bold text-text block tabular-nums">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </span>
                    <span className="text-[10px] text-text-tertiary">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Mode tabs ────────────────────────────── */}
          {!isAnalyzing && !capturedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex gap-1 rounded-2xl bg-bg-subtle p-1"
            >
              {modes.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); setError(null); }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition-all ${
                    mode === m.key
                      ? "bg-white text-primary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <m.icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Content area ──────────────────────────── */}
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              /* ── Multi-step analysis animation ── */
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="card p-6"
              >
                {/* Progress bar */}
                <div className="relative h-1 rounded-full bg-bg-subtle mb-6 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    initial={{ width: "5%" }}
                    animate={{
                      width: `${Math.min(95, ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100)}%`,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {ANALYSIS_STEPS.map((step, i) => {
                    const isActive = i === analysisStep;
                    const isDone = i < analysisStep;
                    const isPending = i > analysisStep;

                    return (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={{
                          opacity: isPending ? 0.35 : 1,
                          scale: isActive ? 1 : 0.97,
                        }}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                          isActive ? "bg-primary-light" : isDone ? "bg-bg-subtle" : ""
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-primary/15"
                              : isDone
                              ? "bg-primary/10"
                              : "bg-bg-subtle"
                          }`}
                        >
                          {isDone ? (
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          ) : isActive ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            >
                              <step.icon className="h-4 w-4 text-primary" />
                            </motion.div>
                          ) : (
                            <step.icon className="h-4 w-4 text-text-tertiary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[13px] font-medium ${
                              isActive ? "text-primary" : isDone ? "text-text" : "text-text-tertiary"
                            }`}
                          >
                            {isDone ? step.label.replace("…", " ✓") : step.label}
                          </p>
                          <p className="text-[10px] text-text-tertiary">{step.sublabel}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-center text-[11px] text-text-tertiary mt-4">
                  Estimasi waktu: 10–30 detik
                </p>
              </motion.div>
            ) : mode === "camera" ? (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Camera onCapture={handleCapture} onClose={() => setMode("upload")} />
              </motion.div>
            ) : mode === "manual" ? (
              <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ManualInput onSubmit={handleManualSubmit} />
              </motion.div>
            ) : (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ImageUploader 
                  initialImage={capturedImage}
                  onImageSelect={handleImageSelect} 
                  onClear={() => setCapturedImage(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-start gap-2.5 rounded-2xl bg-danger-light p-4">
              <AlertCircle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-medium text-danger">{error}</p>
                <button onClick={resetScan} className="mt-1 text-[11px] text-danger/70 underline">Coba lagi</button>
              </div>
            </motion.div>
          )}

          {/* Analyze button (photo mode) */}
          {capturedImage && !isAnalyzing && mode !== "manual" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-2">
              <button
                onClick={handleAnalyze}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[14px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.98]"
              >
                <ScanLine className="h-5 w-5" />
                Analisis Gizi & Harga
              </button>
              <button onClick={resetScan} className="w-full py-2 text-[12px] text-text-tertiary hover:text-text-secondary transition-colors">
                Ganti foto
              </button>
            </motion.div>
          )}

          {/* ── How it works section ──────────────── */}
          {!capturedImage && !isAnalyzing && mode !== "manual" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-4"
            >
              {/* How it works */}
              <div className="card p-5">
                <h3 className="text-[13px] font-bold text-text mb-4">Cara Kerja</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", icon: CameraIcon, title: "Foto atau Input", desc: "Ambil foto baki MBG atau input menu secara manual" },
                    { step: "2", icon: Sparkles, title: "AI Analisis", desc: "Gemini + Qwen deteksi makanan, hitung nutrisi & harga" },
                    { step: "3", icon: BarChart3, title: "Hasil Lengkap", desc: "Skor gizi, estimasi harga, dan rekomendasi perbaikan" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[12px] font-bold text-primary">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-text">{item.title}</p>
                        <p className="text-[11px] text-text-tertiary leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="card-flat p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CameraIcon className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[12px] font-semibold text-text">Tips foto terbaik</p>
                </div>
                <ul className="space-y-1 text-[11px] text-text-secondary">
                  <li>• Foto dari atas agar semua makanan terlihat</li>
                  <li>• Pencahayaan cukup, tidak buram</li>
                  <li>• Seluruh baki masuk dalam frame</li>
                </ul>
              </div>

              {/* Context info */}
              <div className="card-flat p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="h-3.5 w-3.5 text-warning" />
                  <p className="text-[12px] font-semibold text-text">Menu sulit dideteksi?</p>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Beberapa makanan Indonesia sulit diidentifikasi AI dari foto (tempe orek, perkedel, dll).
                  Gunakan tab <b className="text-text">Manual</b> — ketik nama makanan apapun dan AI akan estimasi nutrisinya.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
