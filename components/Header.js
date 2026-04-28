"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";

const GithubIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
);
const LinkedinIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

/** Custom ScanMBG logo — nutrition scan crosshair + leaf motif */
function ScanMBGLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="#2AB05B" />
      
      {/* Scan crosshair corners */}
      <path d="M10 16V12C10 10.895 10.895 10 12 10H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 10H28C29.105 10 30 10.895 30 12V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 24V28C30 29.105 29.105 30 28 30H24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 30H12C10.895 30 10 29.105 10 28V24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Center leaf/nutrition symbol */}
      <path d="M20 14C20 14 25 16 25 21C25 24.5 22 27 20 27" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M20 14C20 14 15 16 15 21C15 24.5 18 27 20 27" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      <line x1="20" y1="18" x2="20" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export default function Header() {
  const [showAbout, setShowAbout] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const year = new Date().getFullYear();
    setCurrentYear(year);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border-light"
      >
        <nav className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <ScanMBGLogo size={34} />
            <span className="text-[18px] font-extrabold tracking-tight text-text">
              Scan<span className="text-primary">MBG</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbout(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-subtle text-text-tertiary hover:bg-bg-muted hover:text-text transition-colors"
              aria-label="About"
            >
              <Info className="h-4 w-4" />
            </button>
            <Link
              href="/"
              className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-primary-dark active:scale-95"
            >
              Scan
            </Link>
          </div>
        </nav>
      </motion.header>

      {/* About modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setShowAbout(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="card w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <ScanMBGLogo size={28} />
                  <h3 className="text-[16px] font-bold text-text">
                    Scan<span className="text-primary">MBG</span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowAbout(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-subtle text-text-tertiary hover:bg-bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  <b className="text-text">ScanMBG</b> adalah alat analisis gizi berbasis AI untuk program 
                  <b className="text-text"> Makan Bergizi Gratis (MBG)</b> Indonesia — membantu memverifikasi 
                  kualitas nutrisi dan transparansi harga makanan untuk 82 juta anak penerima.
                </p>
                <p className="text-[12px] text-text-tertiary leading-relaxed">
                  Cukup foto baki MBG atau input menu manual, AI akan menganalisis komposisi gizi, 
                  menilai kesesuaian dengan standar Kemenkes "Isi Piringku", dan mengestimasi biaya 
                  bahan makanan terhadap budget Rp 15.000/porsi.
                </p>
              </div>

              <div className="card-flat rounded-2xl p-3 mb-5">
                <p className="text-[11px] font-semibold text-text mb-2">Powered by</p>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="rounded-full bg-white px-2.5 py-1 text-text-secondary font-medium shadow-sm">
                    Google Gemini Flash
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-text-secondary font-medium shadow-sm">
                    Qwen 3.5
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-text-secondary font-medium shadow-sm">
                    TKPI Database
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href="https://github.com/gnatnib"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#24292e] py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-[#1b1f23] active:scale-[0.98]"
                >
                  <GithubIcon className="h-4 w-4" />
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/bintangsyafrian"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#0A66C2] py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-[#004182] active:scale-[0.98]"
                >
                  <LinkedinIcon className="h-4 w-4" />
                  LinkedIn
                </a>
              </div>

              <p className="text-center text-[10px] text-text-tertiary mt-4">
                © {currentYear} ScanMBG · Tidak terafiliasi dengan pemerintah
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
