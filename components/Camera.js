"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, SwitchCamera, X } from "lucide-react";

export default function Camera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [isFlipping, setIsFlipping] = useState(false);

  const startCamera = useCallback(async (facing) => {
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setIsReady(true); };
      }
      setStream(mediaStream);
      setError(null);
    } catch {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [facingMode]);

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setFacingMode((p) => (p === "environment" ? "user" : "environment"));
    }, 150);
    setTimeout(() => {
      setIsFlipping(false);
    }, 400); // 400ms is enough to finish the visual flip
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    
    // Scale down to max 800px on the longest edge to speed up AI processing
    const MAX_DIM = 800;
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > height && width > MAX_DIM) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else if (height > MAX_DIM) {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);
    
    // Compress quality slightly more to reduce base64 size
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    onCapture({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg", dataUrl });
  };

  if (error) {
    return (
      <div className="card flex flex-col items-center gap-4 p-10 text-center">
        <CameraIcon className="h-10 w-10 text-text-tertiary" />
        <p className="text-[13px] text-text-secondary">{error}</p>
        <button onClick={() => startCamera(facingMode)} className="rounded-2xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-white">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full aspect-[4/5] sm:aspect-video overflow-hidden rounded-3xl bg-black flex items-center justify-center">
      <motion.video 
        ref={videoRef} 
        autoPlay playsInline muted 
        className="absolute inset-0 h-full w-full object-cover" 
        animate={{ 
          rotateY: isFlipping ? 90 : 0,
          scale: isFlipping ? 0.8 : 1,
          opacity: isFlipping ? 0.3 : 1
        }}
        transition={{ duration: 0.2 }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder corners */}
      <div className="absolute inset-6 pointer-events-none">
        <div className="viewfinder-corner viewfinder-corner-tl" />
        <div className="viewfinder-corner viewfinder-corner-tr" />
        <div className="viewfinder-corner viewfinder-corner-bl" />
        <div className="viewfinder-corner viewfinder-corner-br" />
      </div>

      {/* Scan line */}
      {isReady && (
        <div className="absolute left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent scan-line-anim" style={{ top: "50%" }} />
      )}

      {/* Top hint */}
      <div className="absolute top-4 left-0 right-0 text-center">
        <span className="rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
          Arahkan ke baki MBG
        </span>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 bg-gradient-to-t from-black/70 to-transparent px-6 py-6">
        <button onClick={() => { if (stream) stream.getTracks().forEach((t) => t.stop()); onClose(); }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
          <X className="h-5 w-5" />
        </button>

        <button onClick={capturePhoto} disabled={!isReady}
          className="group flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-white active:scale-90 transition-transform disabled:opacity-50">
          <div className="h-14 w-14 rounded-full bg-white group-hover:scale-95 transition-transform" />
        </button>

        <button onClick={handleFlip} disabled={isFlipping}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm disabled:opacity-50">
          <SwitchCamera className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}
