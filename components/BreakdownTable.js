"use client";

import { motion } from "framer-motion";
import { FoodIconBadge } from "@/lib/food-icons";

const CATEGORY_LABELS = {
  protein_hewani: "Protein Hewani",
  protein_nabati: "Protein Nabati",
  karbohidrat: "Karbohidrat",
  sayur: "Sayuran",
  buah: "Buah",
  lainnya: "Lainnya",
};

const SOURCE_BADGES = {
  tkpi: { label: "TKPI", bg: "bg-primary-light", text: "text-primary-dark" },
  tkpi_fuzzy: { label: "TKPI~", bg: "bg-warning-light", text: "text-warning" },
  estimasi_ai: { label: "AI", bg: "bg-info-light", text: "text-info" },
  perlu_estimasi: { label: "Est.", bg: "bg-bg-subtle", text: "text-text-tertiary" },
};

export default function BreakdownTable({ items, totals }) {
  return (
    <div className="table-container">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border-light">
            <th className="px-3 py-2.5 text-left font-semibold text-text-tertiary">Item</th>
            <th className="px-2 py-2.5 text-right font-semibold text-text-tertiary">Porsi</th>
            <th className="px-2 py-2.5 text-right font-semibold text-text-secondary">Energi</th>
            <th className="px-2 py-2.5 text-right font-semibold text-protein">Protein</th>
            <th className="px-2 py-2.5 text-right font-semibold text-fat">Lemak</th>
            <th className="px-2 py-2.5 text-right font-semibold text-carbs">Karbo</th>
            <th className="px-2 py-2.5 text-right font-semibold text-text-tertiary">Serat</th>
            <th className="px-2 py-2.5 text-center font-semibold text-text-tertiary">Ref</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const source = SOURCE_BADGES[item.sumber_data] || SOURCE_BADGES.estimasi_ai;
            return (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-border-light/60 hover:bg-bg-subtle/50 transition-colors"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <FoodIconBadge foodName={item.nama} kategori={item.kategori} size="sm" />
                    <div>
                      <div className="font-medium text-text text-[12px] whitespace-nowrap">{item.nama}</div>
                      <div className="text-[9px] text-text-tertiary">{CATEGORY_LABELS[item.kategori]}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right text-text-secondary whitespace-nowrap">{item.porsi_gram}g</td>
                <td className="px-2 py-2.5 text-right font-medium text-text whitespace-nowrap">{item.nutrisi_porsi.energi?.toFixed(0)}</td>
                <td className="px-2 py-2.5 text-right text-protein font-medium whitespace-nowrap">{item.nutrisi_porsi.protein?.toFixed(1)}g</td>
                <td className="px-2 py-2.5 text-right text-fat whitespace-nowrap">{item.nutrisi_porsi.lemak?.toFixed(1)}g</td>
                <td className="px-2 py-2.5 text-right text-carbs whitespace-nowrap">{item.nutrisi_porsi.karbohidrat?.toFixed(1)}g</td>
                <td className="px-2 py-2.5 text-right text-text-tertiary whitespace-nowrap">{item.nutrisi_porsi.serat?.toFixed(1)}g</td>
                <td className="px-2 py-2.5 text-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${source.bg} ${source.text}`}>
                    {source.label}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-primary/15 bg-primary-light/40">
            <td className="px-3 py-3 font-bold text-[13px] text-text" colSpan={2}>Total</td>
            <td className="px-2 py-3 text-right font-bold text-text">{totals.energi?.toFixed(0)}<span className="text-text-tertiary font-normal ml-0.5 text-[10px]">kcal</span></td>
            <td className="px-2 py-3 text-right font-bold text-protein">{totals.protein?.toFixed(1)}g</td>
            <td className="px-2 py-3 text-right font-bold text-fat">{totals.lemak?.toFixed(1)}g</td>
            <td className="px-2 py-3 text-right font-bold text-carbs">{totals.karbohidrat?.toFixed(1)}g</td>
            <td className="px-2 py-3 text-right font-bold text-text-secondary">{totals.serat?.toFixed(1)}g</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
