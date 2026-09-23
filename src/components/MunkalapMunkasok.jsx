import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, X, Check, UserMinus } from "lucide-react";

const statusColor = (s) =>
  s === "elerheto" ? "#34C759" : s === "foglalt" ? "#FF9500" : s === "szabadsagon" ? "#5B9BD5" : "#86868B";

export default function MunkalapMunkasok({ munkalap, munkasList, onUpdated }) {
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const assigned = Array.isArray(munkalap.munkasok) ? munkalap.munkasok : [];
  const assignedWorkers = munkasList.filter((mk) => assigned.includes(mk.id));
  const available = munkasList.filter((mk) => !assigned.includes(mk.id));

  const setMunkasok = async (next) => {
    setBusy(true);
    try {
      const updated = await base44.entities.Munkalap.update(munkalap.id, { munkasok: next });
      onUpdated?.(updated);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5 inline-flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />
        Munkások ({assigned.length})
      </p>

      <div className="flex flex-wrap gap-1.5">
        {assignedWorkers.map((mk) => {
          const c = statusColor(mk.status);
          return (
            <span
              key={mk.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border border-[#EDEDF0] bg-[#FBFBFD]"
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[0.625rem] font-semibold" style={{ backgroundColor: c }}>
                {(mk.name || "?").charAt(0).toUpperCase()}
              </span>
              <span className="text-[0.75rem] font-medium text-[#1D1D1F]">{mk.name}</span>
              <button
                onClick={() => setMunkasok(assigned.filter((id) => id !== mk.id))}
                disabled={busy}
                className="w-5 h-5 rounded-full hover:bg-red-500/10 text-[#86868B] hover:text-red-500 flex items-center justify-center disabled:opacity-50"
                title="Eltávolítás"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        {assigned.length === 0 && (
          <p className="text-[0.8125rem] text-[#86868B] italic">Még nincs munkás ráosztva</p>
        )}
      </div>

      <div className="mt-2 relative">
        <button
          onClick={() => setShowAdd((v) => !v)}
          disabled={busy || munkasList.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#E5E5EA] text-[0.75rem] font-medium text-[#1D1D1F] hover:border-[#FF9500]/50 hover:bg-[#FFF7ED] disabled:opacity-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF9500]" /> Hozzáadása
        </button>

        {showAdd && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAdd(false)} />
            <div className="absolute z-20 mt-1 w-64 max-h-60 overflow-y-auto rounded-2xl border border-[#EDEDF0] bg-white shadow-lg p-1">
              {available.length === 0 && (
                <p className="text-[0.8125rem] text-[#86868B] px-3 py-2.5">Nincs elérhető munkás a listában.</p>
              )}
              {available.map((mk) => {
                const c = statusColor(mk.status);
                return (
                  <button
                    key={mk.id}
                    onClick={() => {
                      setMunkasok([...assigned, mk.id]);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-[#F5F5F7] text-left"
                  >
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.625rem] font-semibold shrink-0" style={{ backgroundColor: c }}>
                      {(mk.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-[0.8125rem] text-[#1D1D1F] block truncate">{mk.name}</span>
                      {mk.role && <span className="text-[0.6875rem] text-[#86868B] block truncate">{mk.role}</span>}
                    </span>
                    <Check className="w-4 h-4 text-[#FF9500] shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}