"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Camera from "@/components/Camera";
import ManualInput from "@/components/ManualInput";
import { compressImage } from "@/lib/image-utils";
import {
  Camera as CameraIcon, ImagePlus, PenLine,
  ScanLine, AlertCircle, ShieldCheck, Users, Banknote,
  Utensils, BarChart3, Eye, Sparkles, ChefHat, Target, X, Check, ChevronRight, Clock
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
  const fileInputRef = useRef(null);

  // States: "home", "camera", "manual", "preview"
  const [viewState, setViewState] = useState("home");
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  // Load recent scans
  useEffect(() => {
    const scans = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("scan_") && !key.startsWith("scan_image_")) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key));
          if (data && data.id) {
            const image = sessionStorage.getItem(`scan_image_${data.id}`);
            scans.push({ ...data, image });
          }
        } catch (e) {}
      }
    }
    // Reverse to get the latest (rough approximation without timestamp)
    scans.reverse();
    setRecentScans(scans.slice(0, 3));
  }, [viewState]);

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
    setViewState("preview");
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const compressed = await compressImage(file, 1200, 0.85);
      setCapturedImage(compressed);
      setViewState("preview");
    } catch (err) {
      setError("Gagal memproses gambar.");
    }
  };

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
      setIsAnalyzing(false); // Let them try again
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
      setIsAnalyzing(false);
    }
  };

  const resetToHome = () => {
    setCapturedImage(null);
    setError(null);
    setViewState("home");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <Header hideScanButton />
      <main className="min-h-screen px-4 pb-12 pt-6 bg-gradient-to-br from-[#E8F8EE] via-white to-[#F0FDF4]">
        <div className="mx-auto max-w-lg">

          {/* ──── Hidden File Input for Gallery ──── */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            
            {/* ──── STATE: ANALYZING ──── */}
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="card p-6 mt-10"
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
                            isActive ? "bg-primary/15" : isDone ? "bg-primary/10" : "bg-bg-subtle"
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
                          <p className={`text-[13px] font-medium ${
                            isActive ? "text-primary" : isDone ? "text-text" : "text-text-tertiary"
                          }`}>
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

            /* ──── STATE: CAMERA ──── */
            ) : viewState === "camera" ? (
              <motion.div key="camera" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-text">Ambil Foto MBG</h2>
                  <button onClick={resetToHome} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-subtle text-text-tertiary hover:bg-bg-muted transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Camera onCapture={handleCapture} onClose={resetToHome} />
              </motion.div>

            /* ──── STATE: MANUAL INPUT ──── */
            ) : viewState === "manual" ? (
              <motion.div key="manual" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-text">Input Manual</h2>
                  <button onClick={resetToHome} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-subtle text-text-tertiary hover:bg-bg-muted transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ManualInput onSubmit={handleManualSubmit} />
              </motion.div>

            /* ──── STATE: IMAGE PREVIEW ──── */
            ) : viewState === "preview" && capturedImage ? (
              <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-border-light">
                  <img
                    src={capturedImage.dataUrl}
                    alt="Preview MBG"
                    className="w-full object-cover"
                    style={{ maxHeight: "60vh" }}
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur-md shadow-sm">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[12px] font-bold text-primary">Siap dianalisis</span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    onClick={handleAnalyze}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.98]"
                  >
                    <ScanLine className="h-5 w-5" />
                    Analisis Gizi & Harga
                  </button>
                  <button onClick={resetToHome} className="w-full py-3 text-[13px] font-semibold text-text-secondary hover:bg-bg-subtle rounded-xl transition-colors">
                    Batalkan / Ganti Foto
                  </button>
                </div>
              </motion.div>

            /* ──── STATE: HOME DASHBOARD ──── */
            ) : (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
                {/* Dashboard Greeting */}
                <div className="mb-8 mt-2">
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 mb-4">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Makan Bergizi Gratis</span>
                    </div>
                    <h1 className="text-[32px] font-extrabold text-text leading-[1.15] tracking-tight">
                      Halo! 👋<br/>
                      <span className="text-text-secondary font-medium text-[26px]">Mau cek gizi apa hari ini?</span>
                    </h1>
                  </motion.div>
                </div>

                {/* Primary Action Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  className="mb-8"
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Kamera Card */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setViewState("camera"); setError(null); }}
                      className="flex flex-col items-start gap-4 rounded-3xl bg-primary p-5 shadow-lg shadow-primary/25 transition-shadow"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                        <CameraIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[16px] font-bold text-white">Kamera</h3>
                        <p className="text-[12px] text-white/80 font-medium mt-0.5">Ambil foto tray MBG</p>
                      </div>
                    </motion.button>

                    {/* Galeri Card */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { fileInputRef.current?.click(); setError(null); }}
                      className="flex flex-col items-start gap-4 rounded-3xl bg-white border border-border-light p-5 shadow-sm transition-shadow"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle text-text-secondary">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[16px] font-bold text-text">Galeri</h3>
                        <p className="text-[12px] text-text-tertiary font-medium mt-0.5">Pilih dari Galeri</p>
                      </div>
                    </motion.button>
                  </div>

                  {/* Manual Card */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setViewState("manual"); setError(null); }}
                    className="flex w-full items-center gap-4 rounded-3xl bg-white border border-border-light p-5 shadow-sm transition-shadow"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle text-text-secondary shrink-0">
                      <PenLine className="h-6 w-6" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-[16px] font-bold text-text">Input Manual</h3>
                      <p className="text-[12px] text-text-tertiary font-medium mt-0.5">Ketik nama makanan secara langsung</p>
                    </div>
                  </motion.button>
                </motion.div>


                {/* Recent Scans Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  className="mt-8"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-text-tertiary" />
                      <h3 className="text-[15px] font-bold text-text">Baru Saja di-Scan</h3>
                    </div>
                  </div>

                  {recentScans.length > 0 ? (
                    <div className="space-y-3">
                      {recentScans.map((scan, i) => (
                        <motion.div 
                          key={scan.id} 
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 + (i * 0.1), ease: "easeOut" }}
                          onClick={() => router.push(`/result/${scan.id}`)} 
                          className="flex items-center gap-4 rounded-3xl bg-white border border-border-light p-3 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <div className="h-14 w-14 rounded-2xl bg-bg-subtle overflow-hidden shrink-0 border border-border-light/50">
                             {scan.image ? (
                               <img src={scan.image} alt="Thumbnail Scan" className="h-full w-full object-cover" />
                             ) : (
                               <div className="flex h-full w-full items-center justify-center text-text-tertiary">
                                 <Utensils className="h-5 w-5" />
                               </div>
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-bold text-text truncate">
                              {scan.timestamp 
                                ? new Date(scan.timestamp).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(/\./g, ':') 
                                : scan.foodName || scan.manualItems?.map(i => i.name).join(", ") || "Menu Makanan"
                              }
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                 <Sparkles className="h-3 w-3" />
                                 Skor {Number(scan.mbgScore?.score || 0).toFixed(1)}
                               </span>
                               <span className="text-[10px] text-text-tertiary">·</span>
                               <span className="text-[11px] font-medium text-text-secondary">{Math.round(scan.totals?.energi || 0)} kcal</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-text-tertiary mr-2 shrink-0" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                     <div className="card-flat p-6 text-center border-dashed border-2 border-border-light bg-white/50">
                        <Utensils className="h-8 w-8 text-text-tertiary mx-auto mb-2 opacity-40" />
                        <p className="text-[12px] text-text-secondary font-medium">Belum ada menu yang di-scan</p>
                        <p className="text-[11px] text-text-tertiary mt-1">Riwayat gizi kamu akan muncul di sini</p>
                     </div>
                  )}
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && viewState !== "home" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-start gap-2.5 rounded-2xl bg-danger-light p-4">
              <AlertCircle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-medium text-danger">{error}</p>
                <button onClick={() => setError(null)} className="mt-1 text-[11px] text-danger/70 underline">Tutup</button>
              </div>
            </motion.div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
