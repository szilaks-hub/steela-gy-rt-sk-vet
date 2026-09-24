import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ACTION_LABELS, ACTION_COLORS } from "@/lib/auditLog";
import { Loader2, History } from "lucide-react";

const fmtRel = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "most most";
  if (min < 60) return `${min} perce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} órája`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} napja`;
  return d.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
};

const fmtClock = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("hu-HU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function ActivityFeed({ limit = 60 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.AuditLog.list("-created_date", limit);
      setEvents(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [limit]);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#FF9500]" /> Aktivitás-folyam
          </h3>
          <p className="text-[0.75rem] text-[#86868B] mt-0.5">Ki, mit, mikor — valós időben (e-mail helyett)</p>
        </div>
        <button
          onClick={load}
          className="text-[0.75rem] font-medium text-[#FF9500] hover:underline"
        >
          Frissítés
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-[#FF9500] animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-[0.8125rem] text-[#86868B] py-10 text-center">Még nincs rögzített esemény.</p>
      ) : (
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1 -mr-1">
          {events.map((e) => {
            const color = ACTION_COLORS[e.action] || "#86868B";
            const label = ACTION_LABELS[e.action] || e.action;
            return (
              <div key={e.id} className="flex items-start gap-2.5 py-2 border-b border-[#F2F2F5] last:border-0">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-[#1D1D1F] leading-snug">
                    <span className="font-semibold" style={{ color }}>{label}</span>
                    {e.munkalap_code ? <span className="font-mono text-[#86868B]"> · {e.munkalap_code}</span> : null}
                  </p>
                  <p className="text-[0.6875rem] text-[#86868B] mt-0.5 truncate">
                    {e.actor_name || e.actor_email || "Rendszer"}
                    {e.worker_name ? ` → ${e.worker_name}` : ""}
                    {e.from_status && e.to_status ? ` (${e.from_status} → ${e.to_status})` : ""}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <span className="text-[0.6875rem] text-[#86868B] shrink-0" title={fmtClock(e.created_date)}>
                  {fmtRel(e.created_date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}