import React, { useMemo } from "react";
import { Flag } from "lucide-react";

const AVATAR_COLORS = ["#FF9500", "#FFCC00", "#FF6B35", "#34C759", "#5B9BD5", "#AF52DE", "#FF2D55", "#5856D6"];

export default function FelelosStats({ munkalapok }) {
  const data = useMemo(() => {
    const map = {};
    (munkalapok || []).filter((m) => m.archived !== true).forEach((m) => {
      const key = (m.felelos && m.felelos.trim()) || "Nincs megadva";
      if (!map[key]) map[key] = { felelos: key, jobs: 0, kg: 0, active: 0, done: 0, flagged: 0 };
      const e = map[key];
      e.jobs++;
      e.kg += Number(m.quantity_kg) || 0;
      if (m.status === "felrakva_kesz") e.done++;
      else e.active++;
      if (m.flagged) e.flagged++;
    });
    return Object.values(map).sort((a, b) => b.kg - a.kg);
  }, [munkalapok]);

  const maxKg = Math.max(1, ...data.map((d) => d.kg));
  const totalKg = data.reduce((s, d) => s + d.kg, 0);
  const totalJobs = data.reduce((s, d) => s + d.jobs, 0);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F]">Teljesítmény felelősönként</h3>
          <p className="text-[0.75rem] text-[#86868B] mt-0.5">Ki hány munkát és mennyi kg-ot dolgozott fel</p>
        </div>
        <div className="text-right">
          <p className="text-[1.125rem] font-semibold text-[#1D1D1F] leading-none">{totalJobs}</p>
          <p className="text-[0.75rem] text-[#86868B] mt-1">{Math.round(totalKg).toLocaleString("hu-HU")} kg összesen</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-[0.8125rem] text-[#86868B] py-10 text-center">Nincs adat</p>
      ) : (
        <div className="space-y-3.5">
          {data.map((d, i) => (
            <div key={d.felelos} className="flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[0.8125rem] font-semibold shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {d.felelos.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.875rem] font-medium text-[#1D1D1F] truncate">{d.felelos}</span>
                  <span className="text-[0.8125rem] font-semibold text-[#1D1D1F]">{Math.round(d.kg).toLocaleString("hu-HU")} kg</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF9500] to-[#FFCC00] transition-all"
                    style={{ width: `${(d.kg / maxKg) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center gap-3 text-[0.6875rem] text-[#86868B]">
                  <span>{d.jobs} munka</span>
                  <span className="text-[#FF9500]">{d.active} aktív</span>
                  <span className="text-[#34C759]">{d.done} kész</span>
                  {d.flagged > 0 && (
                    <span className="text-red-500 inline-flex items-center gap-0.5">
                      <Flag className="w-3 h-3" />
                      {d.flagged}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}