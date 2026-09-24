import React from "react";
import { stageMeta, formatDateTime } from "@/lib/munkalapConfig";

export default function MunkalapTimeline({ munkalap }) {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const events = [...history].sort((a, b) => new Date(a.at) - new Date(b.at));

  if (events.length === 0) {
    return <p className="text-[0.8125rem] text-[#86868B] italic">Még nincs rögzített esemény.</p>;
  }

  return (
    <div className="relative">
      {events.map((e, i) => {
        const sm = stageMeta(e.stage);
        const Icon = sm.icon;
        const isLast = i === events.length - 1;
        return (
          <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-[#E5E5EA]" />
            )}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10"
              style={{ backgroundColor: sm.color + "1A", color: sm.color }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 -mt-0.5">
              <p className="text-[0.8125rem] font-semibold text-[#1D1D1F] leading-snug">
                {e.note || sm.label}
              </p>
              <p className="text-[0.6875rem] text-[#86868B] mt-0.5">
                {formatDateTime(e.at) || "—"}
                {e.actor ? ` · ${e.actor}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}