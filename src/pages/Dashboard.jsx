import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, STAGES, stageMeta, stageEntryAt, formatDateTime } from "@/lib/munkalapConfig";
import {
  ClipboardList, Wrench, ShieldCheck, Factory, Truck, PackageCheck, Ban,
  Weight, Timer, Target, TrendingUp, Zap, Gauge, AlertTriangle, Loader2, Clock, Percent, Hourglass,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, PieChart, Pie } from "recharts";
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
  return `${Math.round(ms / 60000)} perc`;
};

export default function Dashboard() {
  const [munkalapok, setMunkalapok] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [list, auditList] = await Promise.all([
          base44.entities.Munkalap.list("-created_date", 500),
          base44.entities.AuditLog.list("-created_date", 500),
        ]);
        setMunkalapok(list);
        setAudits(auditList);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const k = useMemo(() => {
    const live = munkalapok.filter((m) => m.archived !== true);
    const beérkezett = live.length;
    const befogadva = live.filter((m) => m.befogadva_at);
    const megrendelt = live.filter((m) => m.megrendelve_at);
    const megszakított = live.filter((m) => m.status === "megszakitva");
    const lezárt = live.filter((m) => m.status === "lezarva");
    const gyartasbanVolt = live.filter((m) => m.gyartas_kezdete);

    // befogadási idő (munkakeres → befogadás)
    const befogadasiIdok = befogadva.map((m) => {
      const c = m.created_date ? new Date(m.created_date).getTime() : null;
      const b = m.befogadva_at ? new Date(m.befogadva_at).getTime() : null;
      return c && b ? b - c : null;
    }).filter((t) => t != null && t >= 0);
    const avgBefogadas = befogadasiIdok.length ? befogadasiIdok.reduce((a, b) => a + b, 0) / befogadasiIdok.length : null;

    // átlag feldolgozási idő (befogadás → feldolgozás kész)
    const feldolgozasiIdok = live.map((m) => {
      const b = m.befogadva_at ? new Date(m.befogadva_at).getTime() : null;
      const f = m.feldolgozas_kesz_at ? new Date(m.feldolgozas_kesz_at).getTime() : null;
      return b && f ? f - b : null;
    }).filter((t) => t != null && t >= 0);
    const avgFeldolgozas = feldolgozasiIdok.length ? feldolgozasiIdok.reduce((a, b) => a + b, 0) / feldolgozasiIdok.length : null;

    // átlag gyártási idő (gyártás kezdete → gyártás vége)
    const gyartasiIdok = live.map((m) => {
      const s = m.gyartas_kezdete ? new Date(m.gyartas_kezdete).getTime() : null;
      const e = m.gyartas_vege ? new Date(m.gyartas_vege).getTime() : null;
      return s && e ? e - s : null;
    }).filter((t) => t != null && t >= 0);
    const avgGyartas = gyartasiIdok.length ? gyartasiIdok.reduce((a, b) => a + b, 0) / gyartasiIdok.length : null;

    // arányok
    const megrendeltArany = beérkezett ? Math.round((megrendelt.length / beérkezett) * 100) : 0;
    const megszakítottArany = beérkezett ? Math.round((megszakított.length / beérkezett) * 100) : 0;
    const megszakítottKg = megszakított.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);

    // előkészítésre fordított, de nem realizált idő (befogadva → megszakítva, csak megszakított)
    const nemRealizaltIdo = megszakított.map((m) => {
      const b = m.befogadva_at ? new Date(m.befogadva_at).getTime() : null;
      const e = m.megszakitva_at ? new Date(m.megszakitva_at).getTime() : null;
      return b && e ? e - b : null;
    }).filter((t) => t != null && t >= 0).reduce((a, b) => a + b, 0);

    // gyártásra kiadott kg
    const gyartasraKiadottKg = megrendelt.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
    // legyártott kg (rakodható + lezárt elkeszult_mennyiseg)
    const legyartottKg = live.filter((m) => ["rakodhato", "lezarva"].includes(m.status)).reduce((s, m) => s + (Number(m.elkeszult_mennyiseg) || Number(m.quantity_kg) || 0), 0);

    // határidőre elkészült (lezárt, kert_hatarido vs felrakva_at)
    const hataridos = lezárt.filter((m) => m.kert_hatarido);
    const hataridoreKesz = hataridos.filter((m) => {
      const dl = m.kert_hatarido.split("-").map(Number);
      const dlDay = new Date(dl[0], dl[1] - 1, dl[2]); dlDay.setHours(23, 59, 59, 999);
      const done = m.felrakva_at ? new Date(m.felrakva_at).getTime() : null;
      return done && done <= dlDay.getTime();
    }).length;
    const hataridoreArany = hataridos.length ? Math.round((hataridoreKesz / hataridos.length) * 100) : null;

    // sürgősségi kérések (audit alapján)
    const surgoKeresek = audits.filter((a) => a.action === "surgo_keres").length;
    const surgoElfogadva = audits.filter((a) => a.action === "surgo_valasz").length;
    const surgoElfogadvaArany = surgoKeresek ? Math.round((surgoElfogadva / surgoKeresek) * 100) : null;

    // tervezett vs tényleges rakodási idő eltérés (lezárt, varhato_rakodhato vs felrakva_at)
    const eltérések = lezárt.map((m) => {
      if (!m.varhato_rakodhato || !m.felrakva_at) return null;
      const t = m.varhato_rakodhato.split("-").map(Number);
      const terv = new Date(t[0], t[1] - 1, t[2]).getTime();
      const teny = new Date(m.felrakva_at).getTime();
      return (teny - terv) / MS_DAY;
    }).filter((d) => d != null);
    const avgEltérés = eltérések.length ? eltérések.reduce((a, b) => a + b, 0) / eltérések.length : null;

    return {
      beérkezett, befogadva: befogadva.length, megrendelt: megrendelt.length, megszakított: megszakított.length, lezárt: lezárt.length,
      avgBefogadas, avgFeldolgozas, avgGyartas, megrendeltArany, megszakítottArany, megszakítottKg,
      nemRealizaltIdo, gyartasraKiadottKg, legyartottKg, hataridoreArany, hataridoreKesz, hataridosHatarido: hataridos.length,
      surgoKeresek, surgoElfogadvaArany, avgEltérés,
    };
  }, [munkalapok, audits]);

  const count = (fn) => munkalapok.filter((m) => m.archived !== true && fn(m)).length;

  const stats = [
    { label: "Új kérés", value: count((m) => m.status === "munkakeres"), Icon: ClipboardList, color: "#F5C84B" },
    { label: "Feldolgozás alatt", value: count((m) => m.status === "feldolgozas_alatt"), Icon: Wrench, color: "#FF9500" },
    { label: "Vevőre vár", value: count((m) => ["elkeszitve", "vevoi_dontes"].includes(m.status)), Icon: ShieldCheck, color: "#AF52DE" },
    { label: "Gyártásban", value: count((m) => ["gyartasra_kiadva", "gyartasban"].includes(m.status)), Icon: Factory, color: "#0A84FF" },
    { label: "Rakodható", value: count((m) => m.status === "rakodhato"), Icon: Truck, color: "#34C759" },
    { label: "Lezárva", value: count((m) => m.status === "lezarva"), Icon: PackageCheck, color: "#8E8E93" },
    { label: "Megszakítva", value: count((m) => m.status === "megszakitva"), Icon: Ban, color: "#FF6961" },
  ];

  const kpiCards = [
    { label: "Befogadási idő", value: fmtDur(k.avgBefogadas), hint: "kérés → befogadás", Icon: Clock, color: "#FF9500" },
    { label: "Átlag feldolgozás", value: fmtDur(k.avgFeldolgozas), hint: "befogadás → elkészítve", Icon: Hourglass, color: "#5AC8FA" },
    { label: "Átlag gyártási idő", value: fmtDur(k.avgGyartas), hint: "indítás → kész", Icon: Timer, color: "#0A84FF" },
    { label: "Megrendelt arány", value: `${k.megrendeltArany}%`, hint: `${k.megrendelt}/${k.beérkezett} munka`, Icon: Percent, color: "#FF6B35" },
    { label: "Megszakított arány", value: `${k.megszakítottArany}%`, hint: `${k.megszakított} munka`, Icon: Ban, color: "#FF6961" },
    { label: "Megszakított kg", value: `${fmtKg(k.megszakítottKg)} kg`, hint: "elvesztett mennyiség", Icon: Weight, color: "#FF6961" },
    { label: "Gyártásra kiadott", value: `${fmtKg(k.gyartasraKiadottKg)} kg`, hint: "megrendelt összesen", Icon: ShieldCheck, color: "#FF6B35" },
    { label: "Legyártott", value: `${fmtKg(k.legyartottKg)} kg`, hint: "rakodható + lezárt", Icon: Factory, color: "#34C759" },
    { label: "Határidőre kész", value: k.hataridoreArany != null ? `${k.hataridoreArany}%` : "—", hint: k.hataridosHatarido ? `${k.hataridoreKesz}/${k.hataridosHatarido}` : "nincs adat", Icon: Target, color: "#34C759" },
    { label: "Sürgősségi kérések", value: k.surgoKeresek, hint: k.surgoElfogadvaArany != null ? `${k.surgoElfogadvaArany}% vállalt` : "—", Icon: Zap, color: "#FFCC00" },
    { label: "Rakodási eltérés", value: k.avgEltérés != null ? `${k.avgEltérés > 0 ? "+" : ""}${k.avgEltérés.toFixed(1).replace(".", ",")} nap` : "—", hint: "terv vs tényleges", Icon: Gauge, color: "#5B9BD5" },
    { label: "Nem realizált idő", value: fmtDur(k.nemRealizaltIdo), hint: "megszakított előkészítés", Icon: AlertTriangle, color: "#FF6961" },
  ];

  const stageData = STAGES.filter((s) => s.value !== "megszakitva").map((s) => ({
    name: s.short, count: count((m) => m.status === s.value), color: s.color,
  }));

  const opData = OPERATIONS.map((o, i) => ({
    name: o.label, value: count((m) => m.operation === o.value), color: OP_COLORS[i],
  })).filter((d) => d.value > 0);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl shrink-0">
        <h1 className="text-[1rem] font-semibold text-[#1D1D1F]">Áttekintés</h1>
        <p className="text-[0.75rem] text-[#86868B] ml-3 hidden sm:block">Gyártási KPI-k & monitoring</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 text-[#FF9500] animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#E5E5EA] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "14", color: s.color }}><s.Icon className="w-4.5 h-4.5" /></span>
                  <p className="mt-3 text-[1.5rem] font-semibold text-[#1D1D1F] leading-none">{s.value}</p>
                  <p className="mt-1.5 text-[0.75rem] text-[#86868B]">{s.label}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-3">Folyamat KPI-k</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {kpiCards.map((c) => (
                  <div key={c.label} className="bg-white rounded-2xl border border-[#E5E5EA] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.color + "14", color: c.color }}><c.Icon className="w-4.5 h-4.5" /></span>
                    <p className="mt-3 text-[1.25rem] font-semibold text-[#1D1D1F] leading-none">{c.value}</p>
                    <p className="mt-1.5 text-[0.75rem] text-[#86868B]">{c.label}</p>
                    <p className="text-[0.6875rem] text-[#86868B] mt-0.5 truncate">{c.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-4">Munkák fázisonként</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#86868B" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#86868B" }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "#F5F5F7" }} contentStyle={{ borderRadius: 12, border: "1px solid #E5E5EA", fontSize: 13 }} />
                      <Bar dataKey="count" radius={[8, 8, 8, 8]} maxBarSize={56}>
                        {stageData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-4">Műveletek megoszlása</h3>
                {opData.length === 0 ? <p className="text-[0.8125rem] text-[#86868B] py-16 text-center">Nincs adat</p> : (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={opData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                            {opData.map((d, i) => <Cell key={i} fill={d.color} />)}
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

            <div className="grid lg:grid-cols-2 gap-4">
              <FelelosStats munkalapok={munkalapok} />
              <WorkerKPIs munkalapok={munkalapok} />
            </div>

            <ActivityFeed limit={60} />
          </>
        )}
      </div>
    </div>
  );
}