"use client";

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend,
} from "recharts";

const COLORS = {
  protein: "#3B82F6",
  lemak: "#EF4444",
  karbohidrat: "#F59E0B",
};

const CATEGORY_COLORS = {
  protein_hewani: "#3B82F6",
  protein_nabati: "#8B5CF6",
  karbohidrat: "#F59E0B",
  sayur: "#22C55E",
  buah: "#EC4899",
  lainnya: "#94A3B8",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-sm px-3 py-2 text-[11px] shadow-lg">
      <p className="font-semibold text-text">{payload[0]?.name || payload[0]?.payload?.name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.dataKey}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}{p.unit || "g"}
        </p>
      ))}
    </div>
  );
};

export function MacroPieChart({ totals }) {
  const data = useMemo(() => [
    { name: "Protein", value: Math.round(totals.protein * 4 * 10) / 10, grams: totals.protein },
    { name: "Lemak", value: Math.round(totals.lemak * 9 * 10) / 10, grams: totals.lemak },
    { name: "Karbohidrat", value: Math.round(totals.karbohidrat * 4 * 10) / 10, grams: totals.karbohidrat },
  ], [totals]);

  const totalCal = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-5">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={3} dataKey="value" stroke="none">
            {data.map((_, i) => <Cell key={i} fill={Object.values(COLORS)[i]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-2.5">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: Object.values(COLORS)[i] }} />
            <div className="text-[12px]">
              <span className="text-text-secondary">{entry.name}</span>
              <span className="ml-1.5 font-semibold text-text">{entry.grams.toFixed(1)}g</span>
              <span className="ml-1 text-text-tertiary">({totalCal > 0 ? Math.round((entry.value / totalCal) * 100) : 0}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stacked macro bar chart: shows protein, fat, and carbs per item
 */
export function MacroStackedBarChart({ items }) {
  const data = useMemo(() =>
    items
      .filter(i => (i.nutrisi_porsi.energi || 0) > 1)
      .sort((a, b) => (b.nutrisi_porsi.energi || 0) - (a.nutrisi_porsi.energi || 0))
      .map(item => ({
        name: item.nama.length > 12 ? item.nama.substring(0, 12) + "…" : item.nama,
        Protein: Math.round((item.nutrisi_porsi.protein || 0) * 10) / 10,
        Lemak: Math.round((item.nutrisi_porsi.lemak || 0) * 10) / 10,
        Karbo: Math.round((item.nutrisi_porsi.karbohidrat || 0) * 10) / 10,
      })),
  [items]);

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fill: "#9B9B9B", fontSize: 11 }} tickLine={false} axisLine={false} unit="g" />
        <YAxis type="category" dataKey="name" tick={{ fill: "#1A1A1A", fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="Protein" stackId="macro" fill={COLORS.protein} barSize={18} radius={[0, 0, 0, 0]} />
        <Bar dataKey="Lemak" stackId="macro" fill={COLORS.lemak} barSize={18} />
        <Bar dataKey="Karbo" stackId="macro" fill={COLORS.karbohidrat} barSize={18} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProteinBarChart({ items }) {
  const data = useMemo(() =>
    items.filter(i => (i.nutrisi_porsi.protein || 0) > 0.5)
      .sort((a, b) => b.nutrisi_porsi.protein - a.nutrisi_porsi.protein)
      .map(item => ({
        name: item.nama.length > 12 ? item.nama.substring(0, 12) + "…" : item.nama,
        protein: Math.round(item.nutrisi_porsi.protein * 10) / 10,
        fill: CATEGORY_COLORS[item.kategori] || "#94A3B8",
      })),
  [items]);

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fill: "#9B9B9B", fontSize: 11 }} tickLine={false} axisLine={false} unit="g" />
        <YAxis type="category" dataKey="name" tick={{ fill: "#1A1A1A", fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
        <Bar dataKey="protein" name="Protein" unit="g" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NutritionRadarChart({ totals }) {
  const data = useMemo(() => [
    { metric: "Kalori", Aktual: Math.min(100, Math.round((totals.energi / 500) * 100)), Ideal: 100 },
    { metric: "Protein", Aktual: Math.min(100, Math.round((totals.protein / 20) * 100)), Ideal: 100 },
    { metric: "Lemak", Aktual: Math.min(100, Math.round((totals.lemak / 20) * 100)), Ideal: 100 },
    { metric: "Karbo", Aktual: Math.min(100, Math.round((totals.karbohidrat / 75) * 100)), Ideal: 100 },
    { metric: "Serat", Aktual: Math.min(100, Math.round((totals.serat / 5) * 100)), Ideal: 100 },
    { metric: "Kalsium", Aktual: Math.min(100, Math.round((totals.kalsium / 200) * 100)), Ideal: 100 },
    { metric: "Zat Besi", Aktual: Math.min(100, Math.round((totals.zat_besi / 4) * 100)), Ideal: 100 },
    { metric: "Vit. C", Aktual: Math.min(100, Math.round((totals.vitamin_c / 15) * 100)), Ideal: 100 },
  ], [totals]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#E8E8E3" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "#6B6B6B", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9B9B9B", fontSize: 9 }} tickCount={4} />
        <Radar name="Ideal" dataKey="Ideal" stroke="#22C55E20" fill="#22C55E" fillOpacity={0.06} />
        <Radar name="Aktual" dataKey="Aktual" stroke="#2AB05B" fill="#2AB05B" fillOpacity={0.15} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: "11px", color: "#6B6B6B" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function EnergyBreakdownChart({ items }) {
  const data = useMemo(() =>
    items.map(item => ({
      name: item.nama.length > 10 ? item.nama.substring(0, 10) + "…" : item.nama,
      energi: Math.round(item.nutrisi_porsi.energi * 10) / 10,
      fill: CATEGORY_COLORS[item.kategori] || "#94A3B8",
    })),
  [items]);

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fill: "#9B9B9B", fontSize: 11 }} tickLine={false} axisLine={false} unit=" kcal" />
        <YAxis type="category" dataKey="name" tick={{ fill: "#1A1A1A", fontSize: 11 }} tickLine={false} axisLine={false} width={95} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
        <Bar dataKey="energi" name="Energi" unit=" kcal" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
