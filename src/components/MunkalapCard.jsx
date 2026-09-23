import React from "react";
import { MessageSquare, Paperclip, ChevronRight, Calendar } from "lucide-react";
import { operationLabel, operationColor, formatDate } from "@/lib/munkalapConfig";

export default function MunkalapCard({ munkalap, onOpen, commentCount, onAdvance }) {
  const m = munkalap;
  const color = operationColor(m.operation);
  const docCount = (m.documents || []).length;
  const dateStr = m.kiszallitasi_datum || m.gyartasi_datum;
  const tons = Number(m.quantity_tons);
  return (
    <div
      onClick={() => onOpen(m)}
      className="group bg-white rounded-xl border border-[#E5E5EA] p-3.5 pl-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:border-[#FF9500]/40 transition-all cursor-pointer relative overflow-hidden"
    >
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.8125rem] font-semibold text-[#1D1D1F] tracking-tight">{m.code}</span>
        <span
          className="text-[0.6875rem] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: color + "1A", color }}
        >
          {operationLabel(m.operation)}
        </span>
      </div>
      <p className="mt-1.5 text-[0.875rem] text-[#1D1D1F] font-medium truncate">{m.customer_name}</p>
      <div className="mt-1.5 flex items-center gap-3 text-[0.75rem] text-[#86868B]">
        {tons > 0 && (
          <span className="font-semibold text-[#1D1D1F]">{tons.toLocaleString("hu-HU")} t</span>
        )}
        {dateStr && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(dateStr)}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="h-1.5 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF9500] to-[#FFCC00] transition-all"
            style={{ width: `${m.progress || 0}%` }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#86868B]">
          <span className="inline-flex items-center gap-1 text-[0.75rem]">
            <Paperclip className="w-3.5 h-3.5" />
            {docCount}
          </span>
          <span className="inline-flex items-center gap-1 text-[0.75rem]">
            <MessageSquare className="w-3.5 h-3.5" />
            {commentCount}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdvance(m);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center hover:bg-[#FF9500] hover:text-white"
          title="Tovább a következő fázisba"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}