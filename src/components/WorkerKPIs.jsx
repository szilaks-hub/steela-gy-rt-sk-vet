import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Weight, Briefcase } from "lucide-react";

const AVATAR_COLORS = ["#FF9500", "#FFCC00", "#FF6B35", "#34C759", "#5B9BD5", "#AF52DE", "#FF2D55", "#5856D6"];

const fmtKg = (n) => (n || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 });

export default function WorkerKPIs({ munkalapok }) {
  const [munkasok, setMunkasok] = useState([]);
  useEffect(() => {
    base44.entities.Munkas.list("-created_date", 500).then(setMunkasok).catch(() => {});
  }, []);

  const rows = useMemo(() => {
    const map = {};
    munkasok.forEach((mk) => {
      map[mk.id] = { id: mk.id, name: mk.name || "Ismeretlen", status: mk.status, jobs: 0, kg: 0, active: 0, done: 0 };
    });
    (munkalapok || [])
      .filter((m) => m.archived !== true)
      .forEach((m) => {
        const kg = Number(m.quantity_kg) || 0;
        const isDone = m.status === "felrakva_kesz";
        (Array.isArray(m.munkasok) ? m.munkasok : []).forEach((id) => {
          if (!map[id]) map[id] = { id, name: "Ismeretlen", status: "", jobs: 0, kg: 0, active: 0, done: 0 };
          map[id].jobs++;
          map[id].kg += kg;
          if (isDone) map[id].done++;
          else map[id].active++;
        });
      });
    return Object.values(map)
      .filter((r) => r.jobs > 0)
      .sort((a, b) => b.kg - a.kg);
  }, [munkasok, munkalapok]);

  const maxKg = Math.max(1, ...rows.map((r) => r.kg));

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#FF9500]" /> Munkás teljesítmény
          </h3>
          <p className="text-[0.75rem] text-[#86868B] mt-0.5">Ráosztott munkák, feldolgozott kg, aktív/kész arány</p>
        </div>
        <div className="text-right">
          <p className="text-[1.125rem] font-semibold text-[#1D1D1F] leading-none">{rows.length}</p>
          <p className="text-[0.75rem] text-[#86868B] mt-1">aktív munkás</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-[0.8125rem] text-[#86868B] py-10 text-center">Még nincs munkásra osztott munka.</p>
      ) : (
        <div className="space-y-3.5">
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[0.8125rem] font-semibold shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {r.name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.875rem] font-medium text-[#1D1D1F] truncate">{r.name}</span>
                  <span className="text-[0.8125rem] font-semibold text-[#1D1D1F] inline-flex items-center gap-1">
                    <Weight className="w-3 h-3 text-[#86868B]" />
                    {fmtKg(r.kg)} kg
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF9500] to-[#FFCC00] transition-all"
                    style={{ width: `${(r.kg / maxKg) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center gap-3 text-[0.6875rem] text-[#86868B]">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {r.jobs} munka
                  </span>
                  <span className="text-[#FF9500]">{r.active} aktív</span>
                  <span className="text-[#34C759]">{r.done} kész</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}