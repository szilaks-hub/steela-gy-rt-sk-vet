import React from "react";
import { stageMeta } from "@/lib/munkalapConfig";
import { TrendingUp, PackageCheck, Timer, Zap, Activity, Gauge } from "lucide-react";

const STAGE_ORDER = [
  "terv_feldolgozas",
  "elfogadasra_var",
  "gyartas_folyamatban",
  "rakodasra_elojegyezve",
  "felrakva_kesz",
];

const fmtKg = (n) => (n || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 });

const fmtDur = (ms) => {
  if (ms == null || ms < 0 || !isFinite(ms)) return "—";
  const days = ms / 86400000;
  if (days >= 1) return `${days.toFixed(1).replace(".", ",")} nap`;
  const hours = ms / 3600000;
  if (hours >= 1) return `${Math.round(hours)} óra`;
  const mins = Math.round(ms / 60000);
  return `${mins} perc`;
};

export default function MunkalapStats({ munkalap: m }) {
  const history = (m.stage_history || [])
    .filter((h) => h.at)
    .slice()
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  const entryTime = (stage) => history.find((h) => h.stage === stage)?.at;
  const tervAt = entryTime("terv_feldolgozas") || m.created_date;
  const elfogAt = entryTime("elfogadasra_var") || m.elfogadva_at;
  const gyartAt = entryTime("gyartas_folyamatban");
  const keszAt = entryTime("felrakva_kesz");
  const now = Date.now();

  const valaszMs = elfogAt && tervAt ? new Date(elfogAt) - new Date(tervAt) : null;
  const reakcioMs = gyartAt && elfogAt ? new Date(gyartAt) - new Date(elfogAt) : null;

  const prodEnd = keszAt ? new Date(keszAt).getTime() : now;
  const prodDays = gyartAt ? (prodEnd - new Date(gyartAt).getTime()) / 86400000 : 0;

  const totalKg = Number(m.quantity_kg) || 0;
  const doneKg = totalKg * ((m.progress || 0) / 100);
  const remainingKg = Math.max(0, totalKg - doneKg);
  const dailyAvg = prodDays > 0.01 ? doneKg / prodDays : null;
  const etaDays = dailyAvg && dailyAvg > 0 ? remainingKg / dailyAvg : null;

  // phase durations
  const durations = STAGE_ORDER.map((s, i) => {
    const start = entryTime(s);
    if (!start) return { stage: s, ms: null };
    const nextAt = entryTime(STAGE_ORDER[i + 1]);
    const end = nextAt ? new Date(nextAt).getTime() : s === m.status ? now : null;
    return { stage: s, ms: end != null ? end - new Date(start).getTime() : null };
  });
  const maxMs = Math.max(1, ...durations.map((d) => d.ms || 0));

  const kpis = [
    {
      Icon: TrendingUp,
      label: "Napi átlag",
      value: dailyAvg != null ? `${fmtKg(dailyAvg)} kg/nap` : "—",
      hint: prodDays > 0.01 ? `${prodDays.toFixed(1)} nap alapján` : "gyártás előtt",
      accent: "#FF9500",
    },
    {
      Icon: PackageCheck,
      label: "Elkészült",
      value: `${fmtKg(doneKg)} / ${fmtKg(totalKg)} kg`,
      hint: `${m.progress || 0}% • ${fmtKg(remainingKg)} kg maradt`,
      accent: "#34C759",
    },
    {
      Icon: Timer,
      label: "Válaszidő",
      value: fmtDur(valaszMs),
      hint: "terv → elfogadás",
      accent: "#5B9BD5",
    },
    {
      Icon: Zap,
      label: "Reakcióidő",
      value: fmtDur(reakcioMs),
      hint: "elfogadás → gyártás",
      accent: "#AF52DE",
    },
  ];

  return (
    <div>
      <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5 inline-flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" />
        Statisztika
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-3">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: k.accent + "1A", color: k.accent }}
            >
              <k.Icon className="w-3.5 h-3.5" />
            </span>
            <p className="text-[0.6875rem] text-[#86868B]">{k.label}</p>
            <p className="text-[0.875rem] font-semibold text-[#1D1D1F] mt-0.5 leading-tight">{k.value}</p>
            <p className="text-[0.625rem] text-[#86868B] mt-0.5 truncate">{k.hint}</p>
          </div>
        ))}
      </div>

      {etaDays != null && etaDays > 0 && (
        <div className="mt-2.5 rounded-2xl border border-[#FF9500]/30 bg-[#FFF7ED] px-3.5 py-2.5 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#FF9500] shrink-0" />
          <p className="text-[0.8125rem] text-[#1D1D1F]">
            Jelenlegi tempóval várható befejezés: <span className="font-semibold">{etaDays.toFixed(1)} nap</span>
          </p>
        </div>
      )}

      {durations.some((d) => d.ms != null && d.ms > 0) && (
        <div className="mt-2.5 rounded-2xl border border-[#EDEDF0] divide-y divide-[#F2F2F5] overflow-hidden">
          {durations.map((d) => {
            const sm = stageMeta(d.stage);
            const Icon = sm.icon;
            const w = d.ms ? Math.max(2, (d.ms / maxMs) * 100) : 0;
            return (
              <div key={d.stage} className="flex items-center gap-2.5 px-3 py-2">
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: sm.color + "1A", color: sm.color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[0.75rem] text-[#1D1D1F] w-28 shrink-0 truncate">{sm.short}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[#EDEDF0] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${w}%`, backgroundColor: sm.color }}
                  />
                </div>
                <span className="text-[0.75rem] font-semibold text-[#1D1D1F] w-16 text-right shrink-0">
                  {fmtDur(d.ms)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}