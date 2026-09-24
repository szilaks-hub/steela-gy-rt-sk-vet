import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Printer, Scale, Loader2, FileBarChart } from "lucide-react";
import { formatDate } from "@/lib/munkalapConfig";

export default function KgOsszesito() {
  const [all, setAll] = useState([]);
  const [munkalapMap, setMunkalapMap] = useState({});
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.KgModositas.list("-created_date", 500);
      setAll(list);
      const munkak = await base44.entities.Munkalap.list("-created_date", 500);
      const mmap = {};
      munkak.forEach((m) => { mmap[m.id] = m; });
      setMunkalapMap(mmap);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return all.filter((i) => {
      const d = i.datum || (i.created_date || "").slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [all, from, to]);

  const rows = useMemo(() => {
    const map = {};
    filtered.forEach((i) => {
      const key = i.munkalap_id || i.munkalap_code;
      if (!map[key]) map[key] = { key, code: i.munkalap_code, customer: i.customer_name, plus: 0, minus: 0, count: 0 };
      if (i.irany === "plus") map[key].plus += Number(i.mennyiseg_kg) || 0;
      else map[key].minus += Number(i.mennyiseg_kg) || 0;
      map[key].count += 1;
    });
    return Object.values(map)
      .map((r) => {
        const ml = munkalapMap[r.key] || {};
        const eredeti = Number(ml.quantity_kg) || 0;
        const net = r.plus - r.minus;
        const arany = eredeti > 0 ? (net / eredeti) * 100 : 0;
        return { ...r, net, eredeti, korrigalt: eredeti + net, arany };
      })
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [filtered, munkalapMap]);

  const totalPlus = rows.reduce((s, r) => s + r.plus, 0);
  const totalMinus = rows.reduce((s, r) => s + r.minus, 0);
  const totalNet = totalPlus - totalMinus;
  const totalEredeti = rows.reduce((s, r) => s + r.eredeti, 0);
  const totalKorrigalt = rows.reduce((s, r) => s + r.korrigalt, 0);
  const totalArany = totalEredeti > 0 ? (totalNet / totalEredeti) * 100 : 0;

  const fmtPct = (v) => `${v.toFixed(1).replace(".", ",")}%`;

  return (
    <div className="flex flex-col h-full">
      <header className="no-print flex items-center gap-3 px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white"><FileBarChart className="w-5 h-5" /></div>
        <div className="shrink-0">
          <h1 className="text-[1rem] font-semibold text-[#1D1D1F] leading-none">Kg összesítő</h1>
          <p className="text-[0.75rem] text-[#86868B] mt-0.5">Gyártási korrekció · belső infó, nem módosítja a készletet</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[0.75rem] text-[#86868B]">Tól:</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-lg bg-[#F5F5F7] border-transparent px-2.5 text-[0.8125rem] focus-visible:ring-[#FF9500]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.75rem] text-[#86868B]">Ig:</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-lg bg-[#F5F5F7] border-transparent px-2.5 text-[0.8125rem] focus-visible:ring-[#FF9500]" />
          </div>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#1D1D1F] text-white text-[0.8125rem] font-medium hover:bg-[#1D1D1F]/90">
            <Printer className="w-4 h-4" /> Nyomtatás
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-[#FF9500]" /></div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-[#E5E5EA] px-4 py-3">
                <p className="text-[0.6875rem] text-[#86868B]">Munkák száma</p>
                <p className="text-[1.5rem] font-semibold text-[#1D1D1F] leading-none mt-1">{rows.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E5EA] px-4 py-3">
                <p className="text-[0.6875rem] text-[#86868B]">Összes + kg</p>
                <p className="text-[1.5rem] font-semibold text-[#34C759] leading-none mt-1">{totalPlus.toLocaleString("hu-HU")}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E5EA] px-4 py-3">
                <p className="text-[0.6875rem] text-[#86868B]">Összes − kg</p>
                <p className="text-[1.5rem] font-semibold text-[#FF6961] leading-none mt-1">{totalMinus.toLocaleString("hu-HU")}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E5EA] px-4 py-3">
                <p className="text-[0.6875rem] text-[#86868B]">Netto összesen</p>
                <p className="text-[1.5rem] font-semibold text-[#FF9500] leading-none mt-1">{totalNet.toLocaleString("hu-HU")}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[0.8125rem]">
                  <thead>
                    <tr className="bg-[#F5F5F7] text-[#86868B] text-left">
                      <th className="px-4 py-2.5 font-semibold">Munkalap</th>
                      <th className="px-4 py-2.5 font-semibold">Vevő</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Eredeti kg</th>
                      <th className="px-4 py-2.5 font-semibold text-right">+ kg</th>
                      <th className="px-4 py-2.5 font-semibold text-right">− kg</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Netto</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Korrigált</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Arány</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F2F5]">
                    {rows.map((r) => (
                      <tr key={r.code} className="hover:bg-[#FBFBFD]">
                        <td className="px-4 py-2.5 font-mono font-semibold text-[#1D1D1F]">{r.code}</td>
                        <td className="px-4 py-2.5 text-[#1D1D1F] max-w-[220px] truncate">{r.customer}</td>
                        <td className="px-4 py-2.5 text-right text-[#86868B] tabular-nums">{r.eredeti.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-2.5 text-right text-[#34C759] font-medium">{r.plus.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-2.5 text-right text-[#FF6961] font-medium">{r.minus.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-[#1D1D1F]">{r.net.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-[#FF9500] tabular-nums">{r.korrigalt.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-[#E5E5EA] overflow-hidden">
                              <div className="h-full rounded-full bg-[#FF9500]" style={{ width: `${Math.min(Math.abs(r.arany), 100)}%` }} />
                            </div>
                            <span className="text-[#86868B] tabular-nums w-14 text-right">{fmtPct(r.arany)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-[#86868B]">Nincs korrekció a kiválasztott időszakban</td></tr>
                    )}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot>
                      <tr className="bg-[#1D1D1F] text-white">
                        <td className="px-4 py-3 font-semibold" colSpan={2}>Összesen</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#86868B]">{totalEredeti.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#34C759]">{totalPlus.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#FF6961]">{totalMinus.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-3 text-right font-semibold">{totalNet.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#FF9500]">{totalKorrigalt.toLocaleString("hu-HU")}</td>
                        <td className="px-4 py-3 text-right font-semibold">{fmtPct(totalArany)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            <p className="text-center text-[0.6875rem] text-[#86868B] no-print">
              Időszak: {formatDate(from) || "—"} – {formatDate(to) || "—"} · {filtered.length} rögzített korrekció
            </p>
          </div>
        )}
      </div>
    </div>
  );
}