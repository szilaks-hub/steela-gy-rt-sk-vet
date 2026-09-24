import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, STAGES, stageMeta } from "@/lib/munkalapConfig";
import {
  ClipboardList,
  Factory,
  CheckCircle2,
  PackageCheck,
  Weight,
  Timer,
  Target,
  TrendingUp,
  Gauge,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";
import FelelosStats from "@/components/FelelosStats";
import WorkerKPIs from "@/components/WorkerKPIs";
import ActivityFeed from "@/components/ActivityFeed";

const OP_COLORS = ["#FF9500", "#FFCC00", "#FF6B35", "#34C759", "#5B9BD5"];
const MS_DAY = 86400000;

const fmtKg = (n) => (n || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 });

const fmtDur = (ms) => {
  if (ms == null || ms < 0 || !isFinite(ms)) return "—";
  const days = ms / MS_DAY;
  if (days >= 1) return `${days.toFixed(1).replace(".", ",")} nap`;
  const hours = ms / 3600000;
  if (hours >= 1) return `${Math.round(hours)} óra`;
  const mins = Math.round(ms / 60000);
  return `${mins} perc`;
};

const stageEntryAt = (m, stage) => {
  const hist = Array.isArray(m.stage_history) ? m.stage_history : [];
  const h = hist.find((e) => e.stage === stage);
  if (h) return h.at;
  if (stage === "terv_feldolgozas") return m.created_date;
  return null;
};

export default function Dashboard() {
  const [munkalapok, setMunkalapok] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Munkalap.list("-created_date", 500);
        setMunkalapok(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const k = useMemo(() => {
    const active = munkalapok.filter((m) => m.archived !== true && m.status !== "felrakva_kesz");
    const finished = munkalapok.filter((m) => m.status === "felrakva_kesz");
    const live = munkalapok.filter((m) => m.archived !== true);

    const totalKg = live.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
    const doneKg = finished.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);

    // átlag ciklusidő (csak befejezett)
    const cycleTimes = finished
      .map((m) => {
        const created = m.created_date ? new Date(m.created_date).getTime() : null;
        const doneAt = stageEntryAt(m, "felrakva_kesz");
        if (!created || !doneAt) return null;
        return new Date(doneAt).getTime() - created;
      })
      .filter((t) => t != null && t >= 0);
    const avgCycleMs = cycleTimes.length ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : null;

    // határidő-ponosság
    const withDeadline = finished.filter((m) => m.kiszallitasi_datum || m.terv_hatarido);
    const onTime = withDeadline.filter((m) => {
      const dl = m.kiszallitasi_datum || m.terv_hatarido;
      const doneAt = stageEntryAt(m, "felrakva_kesz");
      if (!doneAt) return false;
      const doneDay = new Date(doneAt);
      doneDay.setHours(0, 0, 0, 0);
      const parts = String(dl).split("-").map(Number);
      if (parts.length !== 3) return false;
      const dlDay = new Date(parts[0], parts[1] - 1, parts[2]);
      dlDay.setHours(23, 59, 59, 999);
      return doneDay <= dlDay;
    }).length;
    const onTimePct = withDeadline.length ? Math.round((onTime / withDeadline.length) * 100) : null;

    // teljesítmény: kész kg / nap az első munkalap óta
    const firstCreated = live.length
      ? Math.min(...live.map((m) => (m.created_date ? new Date(m.created_date).getTime() : Date.now())))
      : Date.now();
    const spanDays = Math.max(1, (Date.now() - firstCreated) / MS_DAY);
    const throughputKgDay = doneKg / spanDays;

    // fázisonkénti átlagos idő + szűk keresztmetszet
    const stageDurations = STAGES.map((s, i) => {
      let total = 0;
      let count = 0;
      live.forEach((m) => {
        const at = stageEntryAt(m, s.value);
        if (!at) return;
        const start = new Date(at).getTime();
        const next = STAGES[i + 1];
        const nextAt = next ? stageEntryAt(m, next.value) : null;
        let end;
        if (nextAt) end = new Date(nextAt).getTime();
        else if (m.status === s.value) end = Date.now();
        else return;
        total += end - start;
        count++;
      });
      return { stage: s, avgMs: count ? total / count : null, count };
    });
    const bottleneck = stageDurations
      .filter((d) => d.avgMs != null)
      .sort((a, b) => (b.avgMs || 0) - (a.avgMs || 0))[0];

    return {
      total: live.length,
      activeCount: active.length,
      finishedCount: finished.length,
      totalKg,
      doneKg,
      remainingKg: Math.max(0, totalKg - doneKg),
      avgCycleMs,
      onTimePct,
      onTimeCount: onTime,
      withDeadlineCount: withDeadline.length,
      throughputKgDay,
      stageDurations,
      bottleneck,
    };
  }, [munkalapok]);

  const count = (fn) => munkalapok.filter((m) => m.archived !== true && fn(m)).length;

  const stats = [
    { label: "Összes munkalap", value: k.total, Icon: ClipboardList, color: "#1D1D1F" },
    { label: "Gyártásban / aktív", value: k.activeCount, Icon: Factory, color: "#FF9500" },
    { label: "Függő munkák", value: count((m) => m.status === "elfogadasra_var" && !m.accepted), Icon: CheckCircle2, color: "#FFCC00" },
    { label: "Kész", value: k.finishedCount, Icon: PackageCheck, color: "#34C759" },
  ];

  const kpiCards = [
    {
      label: "Összes kg",
      value: `${fmtKg(k.totalKg)} kg`,
      hint: `${fmtKg(k.doneKg)} kész · ${fmtKg(k.remainingKg)} maradt`,
      Icon: Weight,
      color: "#FF9500",
    },
    {
      label: "Átlag ciklusidő",
      value: fmtDur(k.avgCycleMs),
      hint: "létrehozás → felrakva",
      Icon: Timer,
      color: "#5B9BD5",
    },
    {
      label: "Határidő-ponosság",
      value: k.onTimePct != null ? `${k.onTimePct}%` : "—",
      hint: k.withDeadlineCount ? `${k.onTimeCount}/${k.withDeadlineCount} határidőre` : "nincs adat",
      Icon: Target,
      color: "#34C759",
    },
    {
      label: "Teljesítmény",
      value: `${fmtKg(k.throughputKgDay)} kg/nap`,
      hint: "átlagos átfutás",
      Icon: TrendingUp,
      color: "#AF52DE",
    },
  ];

  const stageData = STAGES.map((s) => ({
    name: s.short,
    count: count((m) => m.status === s.value),
    color: s.color,
  }));

  const opData = OPERATIONS.map((o, i) => ({
    name: o.label,
    value: count((m) => m.operation === o.value),
    color: OP_COLORS[i],
  })).filter((d) => d.value > 0);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl shrink-0">
        <h1 className="text-[1rem] font-semibold text-[#1D1D1F]">Áttekintés</h1>
        <p className="text-[0.75rem] text-[#86868B] ml-3 hidden sm:block">Gyártási KPI-k & monitoring</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-[#FF9500] animate-spin" />
          </div>
        ) : (
          <>
            {/* Állapot KPI-k */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: s.color + "14", color: s.color }}
                  >
                    <s.Icon className="w-5 h-5" />
                  </span>
                  <p className="mt-4 text-[1.625rem] font-semibold text-[#1D1D1F] leading-none">{s.value}</p>
                  <p className="mt-1.5 text-[0.8125rem] text-[#86868B]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Teljesítmény KPI-k */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((c) => (
                <div key={c.label} className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: c.color + "14", color: c.color }}
                  >
                    <c.Icon className="w-5 h-5" />
                  </span>
                  <p className="mt-4 text-[1.375rem] font-semibold text-[#1D1D1F] leading-none">{c.value}</p>
                  <p className="mt-1.5 text-[0.8125rem] text-[#86868B]">{c.label}</p>
                  <p className="text-[0.6875rem] text-[#86868B] mt-0.5 truncate">{c.hint}</p>
                </div>
              ))}
            </div>

            {/* Szűk keresztmetszet figyelmeztetés */}
            {k.bottleneck && (
              <div className="rounded-2xl border border-[#FF9500]/30 bg-[#FFF7ED] px-4 py-3 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#FF9500] shrink-0" />
                <p className="text-[0.8125rem] text-[#1D1D1F]">
                  <span className="font-semibold">Szűk keresztmetszet:</span> a{" "}
                  <span className="font-semibold">{k.bottleneck.stage.label}</span> fázisban átlagosan{" "}
                  <span className="font-semibold">{fmtDur(k.bottleneck.avgMs)}</span> időt töltenek a munkák.
                </p>
              </div>
            )}

            {/* Diagramok */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-4">Munkalapok fázisonként</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#86868B" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#86868B" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "#F5F5F7" }}
                        contentStyle={{ borderRadius: 12, border: "1px solid #E5E5EA", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", fontSize: 13 }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 8, 8]} maxBarSize={64}>
                        {stageData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-4">Műveletek megoszlása</h3>
                {opData.length === 0 ? (
                  <p className="text-[0.8125rem] text-[#86868B] py-16 text-center">Nincs adat</p>
                ) : (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={opData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                            {opData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E5EA", fontSize: 13 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 space-y-2">
                      {opData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2 text-[0.8125rem]">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="flex-1 text-[#1D1D1F]">{d.name}</span>
                          <span className="text-[#86868B] font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Fázisidő / szűk keresztmetszet részletek */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-1 inline-flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-[#FF9500]" /> Fázisonkénti átlagos idő
              </h3>
              <p className="text-[0.75rem] text-[#86868B] mb-4">Mennyi időt töltenek a munkák egy-egy fázisban</p>
              <div className="space-y-2.5">
                {k.stageDurations.map((d) => {
                  const sm = stageMeta(d.stage.value);
                  const maxMs = Math.max(1, ...k.stageDurations.map((x) => x.avgMs || 0));
                  const w = d.avgMs ? Math.max(3, (d.avgMs / maxMs) * 100) : 0;
                  const isBottleneck = k.bottleneck && d.stage.value === k.bottleneck.stage.value;
                  return (
                    <div key={d.stage.value} className="flex items-center gap-3">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: sm.color + "1A", color: sm.color }}
                      >
                        <sm.icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[0.8125rem] text-[#1D1D1F] w-32 shrink-0 truncate">{sm.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#F2F2F5] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${w}%`, backgroundColor: isBottleneck ? "#FF3B30" : sm.color }}
                        />
                      </div>
                      <span className="text-[0.8125rem] font-semibold text-[#1D1D1F] w-20 text-right shrink-0">
                        {fmtDur(d.avgMs)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Felelősök + Munkások */}
            <div className="grid lg:grid-cols-2 gap-4">
              <FelelosStats munkalapok={munkalapok} />
              <WorkerKPIs munkalapok={munkalapok} />
            </div>

            {/* Aktivitás-folyam (e-mail helyett) */}
            <ActivityFeed limit={60} />
          </>
        )}
      </div>
    </div>
  );
}