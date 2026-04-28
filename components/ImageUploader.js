"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImagePlus, X, Check } from "lucide-react";

export default function ImageUploader({ initialImage, onImageSelect, onClear }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(initialImage?.dataUrl || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialImage?.dataUrl) {
      setPreview(initialImage.dataUrl);
    } else {
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [initialImage]);

  const processFile = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const { compressImage } = await import("@/lib/image-utils");
      const compressed = await compressImage(file, 1200, 0.85);
      setPreview(compressed.dataUrl);
      onImageSelect(compressed);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onClear) onClear();
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative overflow-hidden rounded-3xl bg-white shadow-sm"
          >
            <img
              src={preview}
              alt="Preview baki MBG"
              className="w-full rounded-3xl object-cover"
              style={{ maxHeight: "55vh" }}
            />
            <button
              onClick={clearPreview}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">
              <Check className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold text-primary">Siap dianalisis</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`card flex cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed p-12 transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary-light"
                : "border-border hover:border-text-tertiary"
            }`}
          >
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light"
            >
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImagePlus className="h-6 w-6 text-primary" />
              )}
            </motion.div>

            <div className="text-center">
              <p className="text-[13px] font-semibold text-text">
                {isDragging ? "Lepas untuk mengunggah" : "Pilih foto baki MBG"}
              </p>
              <p className="mt-1 text-[11px] text-text-tertiary">
                Ketuk di sini atau seret foto
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
