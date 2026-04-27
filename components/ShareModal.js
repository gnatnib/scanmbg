"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, MessageCircle, Copy, Check, X, Send, Download, Image as ImageIcon } from "lucide-react";

function generateShareCanvas(result) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const w = 600;
    const h = 780;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#F7F7F5");
    bgGrad.addColorStop(1, "#E8F5E9");
    ctx.fillStyle = bgGrad;
    roundRect(ctx, 0, 0, w, h, 0);
    ctx.fill();

    // Card background
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 24, 24, w - 48, h - 48, 24);
    ctx.fill();
    ctx.strokeStyle = "#E8E8E3";
    ctx.lineWidth = 1;
    roundRect(ctx, 24, 24, w - 48, h - 48, 24);
    ctx.stroke();

    const score = result?.mbgScore?.score || 0;
    const grade = result?.mbgScore?.gradeLabel || "";
    const gradeColor = result?.mbgScore?.gradeColor || "#2AB05B";
    const totals = result?.totals || {};
    const items = result?.items || [];
    const deskripsi = result?.deskripsi || "Menu MBG";

    // Header branding
    ctx.fillStyle = "#1A1A1A";
    ctx.font = "bold 22px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    ctx.fillText("ScanMBG", 56, 76);
    ctx.fillStyle = "#9B9B9B";
    ctx.font = "13px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    ctx.fillText("Analisis Gizi MBG", 56, 100);

    // Divider
    ctx.strokeStyle = "#F0F0EC";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(56, 118);
    ctx.lineTo(w - 56, 118);
    ctx.stroke();

    // Score circle
    const cx = w / 2;
    const cy = 200;
    const radius = 56;

    // Score ring bg
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#F0F0EC";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Score ring fill
    const scoreAngle = (score / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + scoreAngle);
    ctx.strokeStyle = gradeColor;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score text
    ctx.fillStyle = "#1A1A1A";
    ctx.font = "bold 32px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${score}`, cx, cy + 8);
    ctx.fillStyle = "#9B9B9B";
    ctx.font = "12px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    ctx.fillText("/10", cx + 24, cy + 8);

    // Grade label
    ctx.fillStyle = gradeColor;
    ctx.font = "bold 14px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    ctx.fillText(grade, cx, cy + 36);

    // Menu description
    ctx.fillStyle = "#6B6B6B";
    ctx.font = "13px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    const desc = deskripsi.length > 50 ? deskripsi.substring(0, 50) + "…" : deskripsi;
    ctx.fillText(desc, cx, cy + 60);

    ctx.textAlign = "left";

    // Macro cards
    const macroY = 300;
    const macroData = [
      { label: "Kalori", value: `${Math.round(totals.energi || 0)}`, unit: "kcal", color: "#F59E0B" },
      { label: "Protein", value: `${(totals.protein || 0).toFixed(1)}`, unit: "g", color: "#3B82F6" },
      { label: "Lemak", value: `${(totals.lemak || 0).toFixed(1)}`, unit: "g", color: "#EF4444" },
      { label: "Karbo", value: `${(totals.karbohidrat || 0).toFixed(1)}`, unit: "g", color: "#F59E0B" },
    ];

    const cardGap = 12;
    const cardW = (w - 48 - 48 - cardGap * 3) / 4;
    macroData.forEach((m, i) => {
      const x = 48 + i * (cardW + cardGap);
      ctx.fillStyle = "#FAFAF8";
      roundRect(ctx, x, macroY, cardW, 68, 12);
      ctx.fill();
      ctx.strokeStyle = "#F0F0EC";
      ctx.lineWidth = 1;
      roundRect(ctx, x, macroY, cardW, 68, 12);
      ctx.stroke();

      ctx.fillStyle = m.color;
      ctx.font = "bold 18px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(m.value, x + cardW / 2, macroY + 32);
      ctx.fillStyle = "#9B9B9B";
      ctx.font = "10px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillText(m.unit, x + cardW / 2, macroY + 46);
      ctx.fillStyle = "#6B6B6B";
      ctx.font = "11px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillText(m.label, x + cardW / 2, macroY + 62);
    });

    ctx.textAlign = "left";

    // Items list
    const listY = 400;
    ctx.fillStyle = "#1A1A1A";
    ctx.font = "bold 14px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    ctx.fillText(`Makanan Terdeteksi (${items.length})`, 56, listY);

    const visibleItems = items.slice(0, 6);
    visibleItems.forEach((item, i) => {
      const iy = listY + 24 + i * 38;

      // Item dot
      const catColors = {
        protein_hewani: "#E67E22", protein_nabati: "#8B6914", karbohidrat: "#D4A017",
        sayur: "#27AE60", buah: "#E74C3C", lainnya: "#7F8C8D",
      };
      ctx.fillStyle = catColors[item.kategori] || "#7F8C8D";
      ctx.beginPath();
      ctx.arc(66, iy + 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Item name
      ctx.fillStyle = "#1A1A1A";
      ctx.font = "13px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      const name = item.nama.length > 24 ? item.nama.substring(0, 24) + "…" : item.nama;
      ctx.fillText(name, 82, iy + 9);

      // Item gram
      ctx.fillStyle = "#9B9B9B";
      ctx.font = "11px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillText(`${item.porsi_gram}g`, 300, iy + 9);

      // Item macros
      ctx.font = "11px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillStyle = "#3B82F6";
      ctx.fillText(`P:${(item.nutrisi_porsi?.protein || 0).toFixed(1)}`, 370, iy + 9);
      ctx.fillStyle = "#EF4444";
      ctx.fillText(`L:${(item.nutrisi_porsi?.lemak || 0).toFixed(1)}`, 430, iy + 9);
      ctx.fillStyle = "#D4A017";
      ctx.fillText(`K:${(item.nutrisi_porsi?.karbohidrat || 0).toFixed(1)}`, 490, iy + 9);
    });

    if (items.length > 6) {
      ctx.fillStyle = "#9B9B9B";
      ctx.font = "11px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillText(`+${items.length - 6} item lainnya`, 82, listY + 24 + 6 * 38 + 9);
    }

    // Pricing summary (if available)
    const pricingY = h - 135;
    if (result?.pricing?.total_estimasi) {
      ctx.fillStyle = "#FAFAF8";
      roundRect(ctx, 48, pricingY, w - 96, 52, 12);
      ctx.fill();
      ctx.strokeStyle = "#F0F0EC";
      ctx.lineWidth = 1;
      roundRect(ctx, 48, pricingY, w - 96, 52, 12);
      ctx.stroke();

      ctx.fillStyle = "#1A1A1A";
      ctx.font = "bold 13px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillText("Estimasi Harga", 64, pricingY + 22);
      ctx.fillStyle = "#6B6B6B";
      ctx.font = "11px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillText(`Budget MBG: Rp 15.000`, 64, pricingY + 40);

      ctx.textAlign = "right";
      ctx.fillStyle = "#1A1A1A";
      ctx.font = "bold 18px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      ctx.fillText(`Rp ${result.pricing.total_estimasi.toLocaleString("id-ID")}`, w - 64, pricingY + 32);
      ctx.textAlign = "left";
    }

    // Footer
    const footerY = h - 64;
    ctx.fillStyle = "#CACAC5";
    ctx.font = "11px 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("scanmbg.vercel.app · Powered by Gemini + Qwen AI", cx, footerY);
    ctx.fillText("Data gizi berdasarkan TKPI Kemenkes RI", cx, footerY + 18);
    ctx.textAlign = "left";

    canvas.toBlob((blob) => resolve({ blob, canvas }), "image/png", 1.0);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function ShareModal({ result, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [embedPreview, setEmbedPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  const generateEmbed = useCallback(async () => {
    setGenerating(true);
    try {
      const { blob, canvas } = await generateShareCanvas(result);
      const url = URL.createObjectURL(blob);
      setEmbedPreview(url);
      canvasRef.current = { blob, canvas };
    } catch (err) {
      console.error("Failed to generate embed:", err);
    }
    setGenerating(false);
  }, [result]);

  const downloadEmbed = () => {
    if (!canvasRef.current?.blob) return;
    const url = URL.createObjectURL(canvasRef.current.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scanmbg-hasil-${result?.id || "scan"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareEmbed = async () => {
    if (!canvasRef.current?.blob) return;
    const file = new File([canvasRef.current.blob], `scanmbg-hasil.png`, { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          text: shareText,
          files: [file],
        });
      } catch {}
    } else {
      downloadEmbed();
    }
  };

  if (!isOpen) return null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const score = result?.mbgScore?.score || 0;
  const grade = result?.mbgScore?.gradeLabel || "";
  const totalKalori = Math.round(result?.totals?.energi || 0);
  const totalProtein = Math.round((result?.totals?.protein || 0) * 10) / 10;
  const totalLemak = Math.round((result?.totals?.lemak || 0) * 10) / 10;
  const totalKarbo = Math.round((result?.totals?.karbohidrat || 0) * 10) / 10;
  const itemCount = result?.items?.length || 0;

  const shareText = `Hasil Scan MBG via ScanMBG\n\nSkor: ${score}/10 (${grade})\nKalori: ${totalKalori} kcal\nProtein: ${totalProtein}g | Lemak: ${totalLemak}g | Karbo: ${totalKarbo}g\n${itemCount} item terdeteksi\n\nCek gizi MBG: ${shareUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="card w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-bold text-text">Bagikan Hasil</h3>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-subtle text-text-tertiary hover:bg-bg-muted transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Embed image preview */}
          {!embedPreview ? (
            <button
              onClick={generateEmbed}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary-light py-4 mb-4 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-light/80"
            >
              <ImageIcon className="h-4 w-4" />
              {generating ? "Membuat gambar..." : "Buat Gambar Embed"}
            </button>
          ) : (
            <div className="mb-4">
              <div className="rounded-2xl overflow-hidden border border-border-light mb-2">
                <img src={embedPreview} alt="Share embed" className="w-full" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadEmbed}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-bg-subtle py-2.5 text-[12px] font-semibold text-text-secondary hover:bg-bg-muted transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={shareEmbed}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>
          )}

          {/* Quick score preview */}
          <div className="card-flat mb-4 p-4 text-center">
            <div className="text-[24px] font-bold text-text">{score}/10</div>
            <div className="text-[11px] text-text-secondary">
              {grade} · {totalKalori} kcal · P:{totalProtein}g L:{totalLemak}g K:{totalKarbo}g
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 px-4 py-3 text-[13px] font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Scan MBG: Skor ${score}/10 (${grade}) | ${totalKalori} kcal | P:${totalProtein}g L:${totalLemak}g K:${totalKarbo}g`)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1DA1F2]/10 px-4 py-3 text-[13px] font-semibold text-[#1DA1F2] transition-colors hover:bg-[#1DA1F2]/20"
            >
              <Send className="h-4 w-4" />
              Twitter
            </a>

            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-2 rounded-2xl bg-bg-subtle px-4 py-3 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-bg-muted col-span-2"
            >
              {copied ? (
                <><Check className="h-4 w-4 text-primary" /><span className="text-primary">Tersalin!</span></>
              ) : (
                <><Copy className="h-4 w-4" />Salin Teks</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
