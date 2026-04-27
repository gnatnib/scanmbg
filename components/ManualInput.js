"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, ChevronDown, Sparkles } from "lucide-react";
import { FoodIconBadge, CATEGORY_ICONS } from "@/lib/food-icons";

const CATEGORIES = [
  { value: "karbohidrat", label: "Karbohidrat" },
  { value: "protein_hewani", label: "Protein Hewani" },
  { value: "protein_nabati", label: "Protein Nabati" },
  { value: "sayur", label: "Sayuran" },
  { value: "buah", label: "Buah" },
  { value: "lainnya", label: "Lainnya" },
];

const COMMON_ITEMS = [
  { nama: "Nasi Putih", kategori: "karbohidrat", gram: 180 },
  { nama: "Ayam Goreng", kategori: "protein_hewani", gram: 70 },
  { nama: "Ayam Bakar", kategori: "protein_hewani", gram: 70 },
  { nama: "Telur Dadar", kategori: "protein_hewani", gram: 55 },
  { nama: "Telur Balado", kategori: "protein_hewani", gram: 60 },
  { nama: "Ikan Goreng", kategori: "protein_hewani", gram: 60 },
  { nama: "Ikan Pindang", kategori: "protein_hewani", gram: 70 },
  { nama: "Daging Rendang", kategori: "protein_hewani", gram: 50 },
  { nama: "Nugget Ayam", kategori: "protein_hewani", gram: 40 },
  { nama: "Sosis", kategori: "protein_hewani", gram: 30 },
  { nama: "Tempe Goreng", kategori: "protein_nabati", gram: 40 },
  { nama: "Tempe Orek", kategori: "protein_nabati", gram: 40 },
  { nama: "Tahu Goreng", kategori: "protein_nabati", gram: 50 },
  { nama: "Tahu Bacem", kategori: "protein_nabati", gram: 50 },
  { nama: "Perkedel", kategori: "protein_nabati", gram: 40 },
  { nama: "Sayur Sop", kategori: "sayur", gram: 80 },
  { nama: "Sayur Bayam", kategori: "sayur", gram: 60 },
  { nama: "Tumis Kangkung", kategori: "sayur", gram: 60 },
  { nama: "Capcay", kategori: "sayur", gram: 70 },
  { nama: "Lalapan Mentimun", kategori: "sayur", gram: 50 },
  { nama: "Sayur Asem", kategori: "sayur", gram: 80 },
  { nama: "Pisang", kategori: "buah", gram: 80 },
  { nama: "Jeruk", kategori: "buah", gram: 80 },
  { nama: "Semangka", kategori: "buah", gram: 100 },
  { nama: "Melon", kategori: "buah", gram: 100 },
  { nama: "Anggur", kategori: "buah", gram: 60 },
  { nama: "Kerupuk", kategori: "lainnya", gram: 10 },
  { nama: "Sambal", kategori: "lainnya", gram: 10 },
];

export default function ManualInput({ onSubmit }) {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customKategori, setCustomKategori] = useState("lainnya");
  const [customGram, setCustomGram] = useState(100);
  const inputRef = useRef(null);

  const filteredSuggestions = searchQuery.length > 0
    ? COMMON_ITEMS.filter((item) =>
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !items.some((i) => i.nama === item.nama)
      )
    : [];

  // Check if query matches any preset exactly
  const hasExactMatch = COMMON_ITEMS.some(
    (item) => item.nama.toLowerCase() === searchQuery.toLowerCase()
  );

  // Show "add custom" option if query doesn't match any preset
  const showAddCustomOption =
    searchQuery.trim().length > 1 && !hasExactMatch;

  const addItem = (item) => {
    setItems((prev) => [...prev, { ...item }]);
    setSearchQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const addCustomFromSearch = () => {
    if (!searchQuery.trim()) return;
    addItem({
      nama: searchQuery.trim(),
      kategori: customKategori,
      gram: customGram,
      isCustom: true,
    });
    setSearchQuery("");
    setShowSuggestions(false);
    setShowCustomForm(false);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGram = (index, gram) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, gram: Number(gram) || 0 } : item))
    );
  };

  const handleSubmit = () => {
    if (items.length === 0) return;
    onSubmit(items);
  };

  return (
    <div className="space-y-4">
      {/* Search & add */}
      <div className="relative">
        <div className="card flex items-center gap-2 px-4 py-3">
          <Search className="h-4 w-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Ketik nama makanan apapun…"
            className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-tertiary"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}>
              <X className="h-3.5 w-3.5 text-text-tertiary" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && (filteredSuggestions.length > 0 || showAddCustomOption) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 z-20 mt-1 card max-h-64 overflow-y-auto shadow-lg"
            >
              {/* Custom item option — always on top when query doesn't match */}
              {showAddCustomOption && (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left bg-primary-light/30 hover:bg-primary-light/50 transition-colors border-b border-border-light"
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-primary">
                      Tambah "{searchQuery.trim()}"
                    </span>
                    <span className="text-[10px] text-text-tertiary ml-1">
                      — AI akan estimasi nutrisinya
                    </span>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              )}

              {/* Preset suggestions */}
              {filteredSuggestions.slice(0, 8).map((item, i) => (
                <button
                  key={i}
                  onClick={() => addItem(item)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-subtle transition-colors"
                >
                  <FoodIconBadge foodName={item.nama} kategori={item.kategori} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-text">{item.nama}</span>
                    <span className="text-[11px] text-text-tertiary ml-2">{item.gram}g</span>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom item inline form — appears when adding unknown food */}
      <AnimatePresence>
        {showCustomForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4 space-y-3 border-2 border-primary/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-[13px] font-semibold text-text">
                Tambah: <span className="text-primary">{searchQuery.trim()}</span>
              </p>
            </div>
            <p className="text-[11px] text-text-tertiary -mt-1">
              AI akan mengestimasi nutrisi makanan ini secara otomatis
            </p>
            <div className="flex gap-2">
              <select
                value={customKategori}
                onChange={(e) => setCustomKategori(e.target.value)}
                className="flex-1 rounded-xl bg-bg-subtle px-3 py-2.5 text-[13px] text-text outline-none appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 rounded-xl bg-bg-subtle px-3">
                <input
                  type="number"
                  value={customGram}
                  onChange={(e) => setCustomGram(Number(e.target.value) || 0)}
                  className="w-14 bg-transparent text-[13px] text-text outline-none text-right"
                  min={1}
                />
                <span className="text-[11px] text-text-tertiary">g</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomForm(false)}
                className="flex-1 rounded-xl bg-bg-subtle py-2.5 text-[13px] text-text-secondary transition-colors hover:bg-bg-muted"
              >
                Batal
              </button>
              <button
                onClick={addCustomFromSearch}
                className="flex-1 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Tambah
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick-add chips (when no search query) */}
      {!searchQuery && items.length === 0 && (
        <div>
          <p className="text-[11px] font-medium text-text-tertiary mb-2">Menu populer:</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_ITEMS.slice(0, 12).map((item, i) => (
              <button
                key={i}
                onClick={() => addItem(item)}
                className="flex items-center gap-1.5 rounded-full bg-bg-subtle px-3 py-1.5 text-[11px] text-text-secondary hover:bg-bg-muted hover:text-text transition-colors"
              >
                <Plus className="h-2.5 w-2.5" />
                {item.nama}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-text-secondary">
            Menu yang dipilih ({items.length})
          </p>
          {items.map((item, i) => (
            <motion.div
              key={`${item.nama}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="card flex items-center gap-3 p-3"
            >
              <FoodIconBadge foodName={item.nama} kategori={item.kategori} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text truncate">
                  {item.nama}
                  {item.isCustom && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                      <Sparkles className="h-2 w-2" /> AI
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-text-tertiary">
                  {CATEGORIES.find((c) => c.value === item.kategori)?.label || item.kategori}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-bg-subtle px-2 py-1">
                <input
                  type="number"
                  value={item.gram}
                  onChange={(e) => updateGram(i, e.target.value)}
                  className="w-12 bg-transparent text-[12px] text-text font-medium outline-none text-right"
                  min={1}
                />
                <span className="text-[10px] text-text-tertiary">g</span>
              </div>
              <button onClick={() => removeItem(i)} className="p-1 rounded-full hover:bg-bg-subtle">
                <X className="h-3.5 w-3.5 text-text-tertiary" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submit */}
      {items.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[14px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark active:scale-[0.98]"
        >
          Analisis {items.length} Item
        </motion.button>
      )}
    </div>
  );
}
