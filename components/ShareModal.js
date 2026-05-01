"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, MessageCircle, Copy, Check, X, Download } from "lucide-react";

// ── Canvas helpers ──────────────────────────────────────────

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

function fillRR(ctx, x, y, w, h, r, fill) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRR(ctx, x, y, w, h, r, color, lw = 1) {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── The embed image generator ───────────────────────────────

const W = 1080; // High-res for mobile sharing
const PAD = 60;

async function generateShareCanvas(result, imageUrl) {
  const score = result?.mbgScore?.score || 0;
  const grade = result?.mbgScore?.gradeLabel || "";
  const gradeColor = result?.mbgScore?.gradeColor || "#2AB05B";
  const totals = result?.totals || {};
  const items = result?.items || [];
  const deskripsi = result?.deskripsi || "Menu MBG";
  const pricing = result?.pricing;

  // ── Calculate section heights
  const IMG_H = imageUrl ? 380 : 0;
  const HEADER_H = imageUrl ? 0 : 80;
  const SCORE_H = 200;
  const MACRO_H = 140;
  const maxItems = Math.min(items.length, 5);
  const ITEMS_H = 52 + maxItems * 52 + (items.length > 5 ? 40 : 0);
  const PRICING_H = pricing?.total_estimasi ? 100 : 0;
  const CTA_H = 60;
  const FOOTER_H = 50;
  const SPACING = 30 * 6;

  const H = 40 + IMG_H + HEADER_H + SCORE_H + MACRO_H + ITEMS_H + PRICING_H + CTA_H + FOOTER_H + SPACING + 40;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // ── Background
  ctx.fillStyle = "#EEF6EE";
  ctx.fillRect(0, 0, W, H);

  // ── Card
  const cx0 = 20, cy0 = 20, cw = W - 40, ch = H - 40;
  fillRR(ctx, cx0, cy0, cw, ch, 32, "#FFFFFF");
  strokeRR(ctx, cx0, cy0, cw, ch, 32, "#E0E0DA");

  ctx.save();
  roundRect(ctx, cx0, cy0, cw, ch, 32);
  ctx.clip();

  let y = cy0;
  const lx = cx0 + PAD; // left content edge
  const rx = cx0 + cw - PAD; // right content edge
  const contentW = cw - PAD * 2;
  const center = W / 2;

  // ── Food image ──────────────────────────────────────────
  if (imageUrl) {
    try {
      const foodImg = await loadImage(imageUrl);
      const sA = foodImg.width / foodImg.height;
      const dA = cw / IMG_H;
      let sx = 0, sy = 0, sw = foodImg.width, sh = foodImg.height;
      if (sA > dA) { sw = foodImg.height * dA; sx = (foodImg.width - sw) / 2; }
      else { sh = foodImg.width / dA; sy = (foodImg.height - sh) / 2; }
      ctx.drawImage(foodImg, sx, sy, sw, sh, cx0, y, cw, IMG_H);
    } catch {
      const g = ctx.createLinearGradient(cx0, y, cx0 + cw, y + IMG_H);
      g.addColorStop(0, "#E8F5E9"); g.addColorStop(1, "#C8E6C9");
      ctx.fillStyle = g;
      ctx.fillRect(cx0, y, cw, IMG_H);
    }

    // Gradient overlay
    const ov = ctx.createLinearGradient(0, y + IMG_H - 120, 0, y + IMG_H);
    ov.addColorStop(0, "rgba(0,0,0,0)");
    ov.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = ov;
    ctx.fillRect(cx0, y + IMG_H - 120, cw, 120);

    // Brand
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ScanMBG", lx, y + IMG_H - 30);

    // Score badge top-right on image
    const bw = 120, bh = 50;
    const bx = rx - bw, by = y + IMG_H - bh - 24;
    fillRR(ctx, bx, by, bw, bh, 14, "rgba(255,255,255,0.95)");
    ctx.fillStyle = gradeColor;
    ctx.font = "bold 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${score}/10`, bx + bw / 2, by + 33);

    y += IMG_H;
  }

  ctx.restore();
  ctx.save();
  roundRect(ctx, cx0, cy0, cw, ch, 32);
  ctx.clip();

  // ── If no image, show header
  if (!imageUrl) {
    y += 30;
    ctx.fillStyle = "#2AB05B";
    ctx.font = "bold 36px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ScanMBG", lx, y + 36);
    ctx.fillStyle = "#ABABAB";
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillText("Analisis Gizi MBG", lx, y + 62);
    y += HEADER_H;
  }

  y += 30;

  // ── Score ring ──────────────────────────────────────────
  const ringR = 58;
  const ringCy = y + ringR + 10;

  // Background ring
  ctx.beginPath();
  ctx.arc(center, ringCy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "#F0F0EC";
  ctx.lineWidth = 10;
  ctx.stroke();

  // Score arc
  const angle = (score / 10) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(center, ringCy, ringR, -Math.PI / 2, -Math.PI / 2 + angle);
  ctx.strokeStyle = gradeColor;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";

  // Score text inside ring — measure with correct fonts to avoid overlap
  ctx.font = "bold 38px system-ui, sans-serif";
  const scoreStr = `${score}`;
  const scoreW = ctx.measureText(scoreStr).width;
  ctx.font = "16px system-ui, sans-serif";
  const tenStr = "/10";
  const tenW = ctx.measureText(tenStr).width;
  const totalW = scoreW + 4 + tenW;
  const groupX = center - totalW / 2;

  ctx.textAlign = "left";
  ctx.fillStyle = "#1A1A1A";
  ctx.font = "bold 38px system-ui, sans-serif";
  ctx.fillText(scoreStr, groupX, ringCy + 13);
  ctx.fillStyle = "#ABABAB";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText(tenStr, groupX + scoreW + 4, ringCy + 13);

  // Grade label below ring
  ctx.textAlign = "center";
  ctx.fillStyle = gradeColor;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText(grade, center, ringCy + ringR + 32);

  y = ringCy + ringR + 56;

  // ── Description ─────────────────────────────────────────
  ctx.fillStyle = "#7A7A7A";
  ctx.font = "18px system-ui, sans-serif";
  const maxDescW = contentW - 40;
  const words = deskripsi.split(" ");
  let line = "";
  let lines = [];
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxDescW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => {
    ctx.fillText(l, center, y + i * 26);
  });
  ctx.textAlign = "left";
  y += Math.min(lines.length, 3) * 26 + 24;

  // ── Macro cards ─────────────────────────────────────────
  const macros = [
    { label: "Kalori", val: `${Math.round(totals.energi || 0)}`, unit: "kcal", color: "#F59E0B" },
    { label: "Protein", val: `${(totals.protein || 0).toFixed(1)}`, unit: "g", color: "#3B82F6" },
    { label: "Lemak", val: `${(totals.lemak || 0).toFixed(1)}`, unit: "g", color: "#EF4444" },
    { label: "Karbo", val: `${(totals.karbohidrat || 0).toFixed(1)}`, unit: "g", color: "#D4A017" },
  ];

  const gapM = 16;
  const mW = (contentW - gapM * 3) / 4;
  const mH = 105;

  macros.forEach((m, i) => {
    const mx = lx + i * (mW + gapM);
    fillRR(ctx, mx, y, mW, mH, 16, "#FAFAF8");
    strokeRR(ctx, mx, y, mW, mH, 16, "#EFEFE8");

    // Color accent
    fillRR(ctx, mx + 14, y + 8, mW - 28, 4, 2, m.color);

    ctx.textAlign = "center";
    ctx.fillStyle = m.color;
    ctx.font = "bold 30px system-ui, sans-serif";
    ctx.fillText(m.val, mx + mW / 2, y + 48);
    ctx.fillStyle = "#ABABAB";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(m.unit, mx + mW / 2, y + 68);
    ctx.fillStyle = "#7A7A7A";
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.fillText(m.label, mx + mW / 2, y + 92);
  });
  ctx.textAlign = "left";
  y += mH + 30;

  // ── Food items list ─────────────────────────────────────
  ctx.fillStyle = "#1A1A1A";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText(`Makanan Terdeteksi (${items.length})`, lx, y + 6);
  y += 30;

  const catColors = {
    protein_hewani: "#E67E22", protein_nabati: "#8B6914", karbohidrat: "#D4A017",
    sayur: "#27AE60", buah: "#E74C3C", lainnya: "#7F8C8D",
  };

  items.slice(0, 5).forEach((item) => {
    // Dot
    ctx.fillStyle = catColors[item.kategori] || "#7F8C8D";
    ctx.beginPath();
    ctx.arc(lx + 10, y + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.fillStyle = "#1A1A1A";
    ctx.font = "600 20px system-ui, sans-serif";
    const name = item.nama.length > 18 ? item.nama.substring(0, 18) + "…" : item.nama;
    ctx.fillText(name, lx + 30, y + 18);

    // Gram
    ctx.fillStyle = "#ABABAB";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(`${item.porsi_gram}g`, lx + 320, y + 18);

    // P / L / K columns — right aligned
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#3B82F6";
    ctx.fillText(`P:${(item.nutrisi_porsi?.protein || 0).toFixed(1)}`, rx - 200, y + 18);
    ctx.fillStyle = "#EF4444";
    ctx.fillText(`L:${(item.nutrisi_porsi?.lemak || 0).toFixed(1)}`, rx - 100, y + 18);
    ctx.fillStyle = "#D4A017";
    ctx.fillText(`K:${(item.nutrisi_porsi?.karbohidrat || 0).toFixed(1)}`, rx, y + 18);
    ctx.textAlign = "left";

    y += 52;
  });

  if (items.length > 5) {
    ctx.fillStyle = "#ABABAB";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(`+${items.length - 5} item lainnya`, lx + 30, y + 10);
    y += 40;
  }

  y += 16;

  // ── Pricing ─────────────────────────────────────────────
  if (pricing?.total_estimasi) {
    fillRR(ctx, lx, y, contentW, 80, 16, "#FAFAF8");
    strokeRR(ctx, lx, y, contentW, 80, 16, "#EFEFE8");

    ctx.fillStyle = "#1A1A1A";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.fillText("Estimasi Harga", lx + 24, y + 32);
    ctx.fillStyle = "#ABABAB";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("Budget MBG: Rp 15.000", lx + 24, y + 58);

    const isUnder = (pricing.selisih || 0) >= 0;
    ctx.textAlign = "right";
    ctx.fillStyle = isUnder ? "#22C55E" : "#EF4444";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillText(`Rp ${pricing.total_estimasi.toLocaleString("id-ID")}`, rx - 24, y + 50);
    ctx.textAlign = "left";

    y += 100;
  }

  // ── CTA
  y += 8;
  ctx.textAlign = "center";
  ctx.fillStyle = "#2AB05B";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("Cek gizi menu MBG kamu juga di scanmbg.vercel.app 👆", center, y + 10);

  // ── Footer
  ctx.restore();
  ctx.fillStyle = "#C5C5C0";
  ctx.font = "14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Powered by Gemini + Gemma AI · Data TKPI Kemenkes RI", center, H - 28);
  ctx.textAlign = "left";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
  });
}

// ── X icon ──────────────────────────────────────────────────

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// ── ShareModal ──────────────────────────────────────────────

export default function ShareModal({ result, imageUrl, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [embedPreview, setEmbedPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const blobRef = useRef(null);

  // Auto-generate embed on open
  useEffect(() => {
    if (!isOpen || !result) {
      setEmbedPreview(null);
      blobRef.current = null;
      return;
    }
    let cancelled = false;
    setGenerating(true);
    generateShareCanvas(result, imageUrl)
      .then((blob) => {
        if (cancelled) return;
        setEmbedPreview(URL.createObjectURL(blob));
        blobRef.current = blob;
        setGenerating(false);
      })
      .catch(() => { if (!cancelled) setGenerating(false); });
    return () => { cancelled = true; };
  }, [isOpen, result, imageUrl]);

  if (!isOpen) return null;

  const siteUrl = "https://scanmbg.vercel.app";
  const score = result?.mbgScore?.score || 0;
  const grade = result?.mbgScore?.gradeLabel || "";
  const totalKalori = Math.round(result?.totals?.energi || 0);
  const totalProtein = (result?.totals?.protein || 0).toFixed(1);
  const totalLemak = (result?.totals?.lemak || 0).toFixed(1);
  const totalKarbo = (result?.totals?.karbohidrat || 0).toFixed(1);
  const itemCount = result?.items?.length || 0;

  // The detailed message the user likes
  const detailedText = `🍱 Ini Score Menu MBG-ku hari ini!\n\n📊 Skor: ${score}/10 (${grade})\n🔥 Kalori: ${totalKalori} kcal\n💪 Protein: ${totalProtein}g | Lemak: ${totalLemak}g | Karbo: ${totalKarbo}g\n🥗 ${itemCount} item terdeteksi\n\nMau cek gizi menu MBG kamu juga? Scan di sini 👇\n${siteUrl}`;

  const downloadEmbed = () => {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scanmbg-hasil-${result?.id || "scan"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareWhatsApp = async () => {
    // Try Web Share API first (works well on mobile — image+text together)
    if (blobRef.current && navigator.share) {
      const file = new File([blobRef.current], "scanmbg-hasil.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: detailedText });
          return;
        } catch { /* user cancelled or failed, fall through */ }
      }
    }
    // Fallback: open WhatsApp with text (user can attach downloaded image)
    downloadEmbed();
    window.open(`https://wa.me/?text=${encodeURIComponent(detailedText)}`, "_blank");
  };

  const shareX = async () => {
    const xText = `🍱 Score Menu MBG-ku: ${score}/10 (${grade}) | ${totalKalori} kcal | P:${totalProtein}g L:${totalLemak}g K:${totalKarbo}g\n\nCek gizi MBG kamu juga!`;
    if (blobRef.current && navigator.share) {
      const file = new File([blobRef.current], "scanmbg-hasil.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: xText });
          return;
        } catch { /* fall through */ }
      }
    }
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(siteUrl)}`, "_blank");
  };

  const shareGeneric = async () => {
    if (blobRef.current && navigator.share) {
      const file = new File([blobRef.current], "scanmbg-hasil.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: detailedText });
          return;
        } catch { /* fall through */ }
      }
    }
    downloadEmbed();
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(detailedText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = detailedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="card w-full max-w-sm p-5 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-text">Bagikan Hasil</h3>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-subtle text-text-tertiary hover:bg-bg-muted transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Embed preview */}
          <div className="mb-4">
            {generating ? (
              <div className="flex items-center justify-center rounded-2xl bg-bg-subtle py-14">
                <div className="flex items-center gap-2 text-[13px] text-text-tertiary">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                  Membuat gambar...
                </div>
              </div>
            ) : embedPreview ? (
              <>
                <div className="rounded-2xl overflow-hidden border border-border-light mb-2.5 shadow-sm">
                  <img src={embedPreview} alt="Share embed" className="w-full" />
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadEmbed} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-bg-subtle py-2.5 text-[12px] font-semibold text-text-secondary hover:bg-bg-muted transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                  <button onClick={shareGeneric} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-semibold text-white hover:bg-primary-dark transition-colors">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={shareWhatsApp} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 px-4 py-3 text-[13px] font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>

            <button onClick={shareX} className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-200">
              <XIcon className="h-3.5 w-3.5" />
              Post di X
            </button>

            <button onClick={copyText} className="flex items-center justify-center gap-2 rounded-2xl bg-bg-subtle px-4 py-3 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-bg-muted col-span-2">
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
