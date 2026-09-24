import React from "react";
import { MessageSquare, Paperclip, Calendar, Flag, Clock, AlertCircle, Zap } from "lucide-react";
import { operationLabel, operationColor, stageMeta, formatDate, deadlineStatus, staleInfo } from "@/lib/munkalapConfig";
import { BellRing } from "lucide-react";

export default function MunkalapCard({ munkalap, onOpen, commentCount, onFlag }) {
  const m = munkalap;
  const stage = stageMeta(m.status);
  const StageIcon = stage.icon;
  const opColor = operationColor(m.operation);
  const docCount = (m.documents || []).length;
  const kg = Number(m.quantity_kg);
  const dl = deadlineStatus(m.kert_hatarido);
  const hasSurgo = m.surgo_allapot === "pending";
  const isMegszakitva = m.status === "megszakitva";
  const isLezarva = m.status === "lezarva";
  const stale = staleInfo(m);

  return (
    <div
      onClick={() => onOpen(m)}
      className={`group bg-white rounded-2xl border p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden ${stale ? "border-[#FF9500] steela-stale-flash" : "border-[#E5E5EA]"}`}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: stale ? "#FF6B35" : stage.color }} />

      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.8125rem] font-semibold text-[#1D1D1F] tracking-tight">{m.code}</span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold whitespace-nowrap"
          style={{ backgroundColor: stage.color + "1A", color: stage.color }}
        >
          <StageIcon className="w-3 h-3" />
          {stage.short}
        </span>
      </div>

      <p className="mt-2 text-[0.9375rem] text-[#1D1D1F] font-semibold truncate">{m.customer_name}</p>
      {m.project_name && <p className="text-[0.75rem] text-[#86868B] truncate">{m.project_name}</p>}

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.6875rem] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: opColor + "1A", color: opColor }}
        >
          {operationLabel(m.operation)}
        </span>
        {kg > 0 && <span className="text-[0.8125rem] font-semibold text-[#1D1D1F]">{kg.toLocaleString("hu-HU")} kg</span>}
      </div>

      {(m.varhato_rakodhato || m.gyartasi_datum) && (
        <div className="mt-2.5 rounded-lg bg-[#F5F5F7] px-2.5 py-1.5">
          <p className="text-[0.6875rem] text-[#86868B]">Várhatóan rakodható</p>
          <p className="text-[0.8125rem] font-semibold text-[#1D1D1F] inline-flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#FF9500]" />
            {formatDate(m.varhato_rakodhato || m.gyartasi_datum)}
          </p>
        </div>
      )}

      {m.felelos && (
        <p className="mt-2 text-[0.6875rem] text-[#86868B]">
          Felelős: <span className="text-[#1D1D1F] font-medium">{m.felelos}</span>
        </p>
      )}

      {stale && (
        <div className="mt-2.5 rounded-lg bg-[#FF9500]/12 border border-[#FF9500]/45 px-2.5 py-1.5 flex items-center gap-1.5">
          <BellRing className="w-3.5 h-3.5 text-[#FF6B35] shrink-0 animate-pulse" />
          <span className="text-[0.6875rem] font-semibold text-[#FF6B35]">
            {m.status === "munkakeres" ? "VÁLASZ NÉLKÜL" : "VEVŐI DÖNTÉSRE VÁR"} · {stale.hours} órája
          </span>
        </div>
      )}

      {hasSurgo && (
        <div className="mt-2.5 rounded-lg bg-[#FFCC00]/15 border border-[#FFCC00]/40 px-2.5 py-1.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#FF9500] shrink-0" />
          <span className="text-[0.6875rem] font-semibold text-[#9a7b00]">KORÁBBI IDŐPONT KÉRVE</span>
        </div>
      )}

      {isMegszakitva && (
        <div className="mt-2.5 rounded-lg bg-[#FF6961]/10 border border-[#FF6961]/30 px-2.5 py-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#FF6961] shrink-0" />
          <span className="text-[0.6875rem] font-semibold text-[#FF6961]">MEGSZAKÍTVA</span>
        </div>
      )}

      {m.kert_hatarido && !isLezarva && !isMegszakitva && dl && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[0.6875rem]">
          <Clock className="w-3 h-3" style={{ color: dl.color }} />
          <span style={{ color: dl.color }} className="font-medium">Határidő: {formatDate(m.kert_hatarido)} ({dl.label})</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#86868B]">
          <button
            onClick={(e) => { e.stopPropagation(); onFlag?.(m); }}
            className={`inline-flex items-center gap-1 text-[0.75rem] transition-colors ${m.flagged ? "text-red-500" : "hover:text-[#1D1D1F]"}`}
            title={m.flagged ? "Jelölés eltávolítása" : "Kiemeltre jelölés"}
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <span className="inline-flex items-center gap-1 text-[0.75rem]">
            <Paperclip className="w-3.5 h-3.5" /> {docCount}
          </span>
          <span className="inline-flex items-center gap-1 text-[0.75rem]">
            <MessageSquare className="w-3.5 h-3.5" /> {commentCount}
          </span>
        </div>
        <span className="text-[0.6875rem] text-[#86868B] group-hover:text-[#FF9500] font-medium">Részletek →</span>
      </div>
    </div>
  );
}