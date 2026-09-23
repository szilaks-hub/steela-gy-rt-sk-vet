import React from "react";
import { MessageSquare, Paperclip, ChevronRight } from "lucide-react";
import { operationLabel } from "@/lib/munkalapConfig";

export default function MunkalapCard({ munkalap, onOpen, commentCount, onAdvance }) {
  const m = munkalap;
  const docCount = (m.documents || []).length;
  return (
    <div
      onClick={() => onOpen(m)}
      className="group bg-white rounded-xl border border-[#E5E5EA] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:border-[#FF9500]/40 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.8125rem] font-semibold text-[#1D1D1F] tracking-tight">{m.code}</span>
        <span className="text-[0.6875rem] font-medium px-2 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] whitespace-nowrap">
          {operationLabel(m.operation)}
        </span>
      </div>
      <p className="mt-1.5 text-[0.875rem] text-[#1D1D1F] font-medium truncate">{m.customer_name}</p>
      {m.description && (
        <p className="mt-1 text-[0.8125rem] text-[#86868B] line-clamp-2 leading-snug">{m.description}</p>
      )}
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