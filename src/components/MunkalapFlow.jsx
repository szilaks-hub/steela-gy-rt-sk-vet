import React from "react";
import { motion } from "framer-motion";
import { STAGES, formatDate, deadlineStatus, formatDays } from "@/lib/munkalapConfig";
import { CheckCircle2, Clock, Circle } from "lucide-react";

const formatDuration = (ms) => {
  if (ms == null || ms < 0 || !isFinite(ms)) return null;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days >= 1) return `${days} nap${hours > 0 ? ` ${hours} óra` : ""}`;
  if (hours >= 1) return `${hours} óra${mins > 0 ? ` ${mins} perc` : ""}`;
  return `${mins} perc`;
};

const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("hu-HU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function MunkalapFlow({ munkalap }) {
  const m = munkalap;
  const history = Array.isArray(m.stage_history) ? m.stage_history : [];
  const entryAt = (stage) => {
    const h = history.find((e) => e.stage === stage);
    if (h) return h.at;
    if (stage === "terv_feldolgozas") return m.created_date;
    return null;
  };
  const currentIndex = STAGES.findIndex((s) => s.value === m.status);
  const isComplete = m.status === "felrakva_kesz";
  const now = Date.now();
  const createdMs = m.created_date ? new Date(m.created_date).getTime() : null;
  const lastAt = entryAt(STAGES[STAGES.length - 1].value);
  const totalMs = createdMs ? (lastAt ? new Date(lastAt).getTime() : now) - createdMs : null;
  const dl = deadlineStatus(m.terv_hatarido);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#FAFAFC] to-white border border-[#E5E5EA] p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
        <div className="inline-flex items-center gap-1.5 text-[0.75rem]">
          <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
          <span className="text-[#86868B]">Beérkezett:</span>
          <span className="font-medium text-[#1D1D1F]">{formatDateTime(m.created_date) || "—"}</span>
        </div>
        {m.terv_hatarido && (
          <div className="inline-flex items-center gap-1.5 text-[0.75rem]">
            <Clock className="w-3 h-3 text-[#86868B]" />
            <span className="text-[#86868B]">Vevő határidő:</span>
            <span className="font-medium text-[#1D1D1F]">{formatDate(m.terv_hatarido)}</span>
            {dl && (
              <span
                className="font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: dl.color + "1A", color: dl.color }}
              >
                {dl.label}
              </span>
            )}
          </div>
        )}
        {totalMs != null && (
          <div className="inline-flex items-center gap-1.5 text-[0.75rem] ml-auto">
            <span className="text-[#86868B]">Gyártási idő:</span>
            <span className="font-semibold text-[#1D1D1F]">{formatDays(totalMs)}</span>
          </div>
        )}
      </div>

      <div className="relative">
        {STAGES.map((stage, i) => {
          const at = entryAt(stage.value);
          const atMs = at ? new Date(at).getTime() : null;
          const nextStage = STAGES[i + 1];
          const nextAt = nextStage ? entryAt(nextStage.value) : null;
          const nextMs = nextAt ? new Date(nextAt).getTime() : null;
          let duration = null;
          if (atMs) {
            if (nextMs) duration = nextMs - atMs;
            else if (i === currentIndex && !isComplete) duration = now - atMs;
          }
          const state = i < currentIndex ? "done" : i === currentIndex ? (isComplete ? "done" : "current") : "upcoming";
          const Icon = stage.icon;
          const isLast = i === STAGES.length - 1;
          return (
            <div key={stage.value} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && (
                <div
                  className="absolute left-[15px] top-8 bottom-1 w-0.5"
                  style={{ backgroundColor: i < currentIndex ? "#34C759" : "#E5E5EA" }}
                />
              )}
              <div className="relative shrink-0">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center relative z-10"
                  style={{
                    backgroundColor: state === "done" ? "#34C759" : state === "current" ? "#FF9500" : "#fff",
                    color: state === "upcoming" ? "#C7C7CC" : "#fff",
                    border: state === "upcoming" ? "2px solid #E5E5EA" : "none",
                  }}
                >
                  {state === "done" ? <CheckCircle2 className="w-4 h-4" /> : state === "current" ? <Icon className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                </motion.div>
                {state === "current" && (
                  <motion.span
                    className="absolute inset-0 rounded-full z-0"
                    animate={{ boxShadow: ["0 0 0 0 rgba(255,149,0,0.45)", "0 0 0 10px rgba(255,149,0,0)"] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
              </div>
              <motion.div
                initial={{ x: -8, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.04 }}
                className="flex-1 -mt-0.5 min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[0.875rem] font-semibold ${state === "upcoming" ? "text-[#86868B]" : "text-[#1D1D1F]"}`}>
                    {stage.label}
                  </span>
                  {duration != null && (
                    <span
                      className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        backgroundColor: state === "current" ? "rgba(255,149,0,0.12)" : "rgba(52,199,89,0.12)",
                        color: state === "current" ? "#FF9500" : "#34C759",
                      }}
                    >
                      {state === "current" ? "folyamatban · " : ""}
                      {formatDuration(duration)}
                    </span>
                  )}
                </div>
                <p className="text-[0.75rem] text-[#86868B] mt-0.5">
                  {at ? formatDateTime(at) : state === "upcoming" ? "még nem kezdődött" : "—"}
                </p>
                {stage.value === "elfogadasra_var" && m.elfogadva_at && (
                  <p className="text-[0.6875rem] text-[#34C759] mt-1 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Elfogadva: {formatDateTime(m.elfogadva_at)}
                  </p>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}