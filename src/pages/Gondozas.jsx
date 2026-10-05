import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, STAGES, stageMeta } from "@/lib/munkalapConfig";
import MunkalapDetail from "@/components/MunkalapDetail";
import { Search, Loader2, Building2, X, Layers } from "lucide-react";

export default function Gondozas() {
  const [partners, setPartners] = useState([]);
  const [munkalapok, setMunkalapok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [selectedMunkalap, setSelectedMunkalap] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pList, mList] = await Promise.all([
        base44.entities.Partner.list("name", 500),
        base44.entities.Munkalap.list("-created_date", 500),
      ]);
      setPartners(pList || []);
      setMunkalapok(mList || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const partnerRows = useMemo(() => {
    const byName = {};
    (munkalapok || []).forEach((m) => {
      const key = (m.customer_name || "").toLowerCase();
      if (!key) return;
      if (!byName[key]) byName[key] = { partner: null, munkak: [] };
      byName[key].munkak.push(m);
    });
    (partners || []).forEach((p) => {
      const key = (p.name || "").toLowerCase();
      if (byName[key]) byName[key].partner = p;
    });
    return Object.values(byName).map((r, i) => ({
      id: r.partner?.id || `n_${i}`,
      name: r.partner?.name || r.munkak[0]?.customer_name || "Ismeretlen",
      partner: r.partner,
      munkak: r.munkak,
    }));
  }, [partners, munkalapok]);

  const searched = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return partnerRows;
    return partnerRows.filter((r) => (r.name || "").toLowerCase().includes(q));
  }, [partnerRows, search]);

  const effectiveSelected = useMemo(() => {
    if (selectedIds === null) return new Set(searched.map((r) => r.id));
    return selectedIds;
  }, [selectedIds, searched]);

  const rows = searched.filter((r) => effectiveSelected.has(r.id));

  const togglePartner = (id) => {
    setSelectedIds((prev) => {
      const base = prev === null ? new Set(searched.map((r) => r.id)) : new Set(prev);
      if (base.has(id)) base.delete(id); else base.add(id);
      return base;
    });
  };

  const selectAll = () => setSelectedIds(null);

  const cellMunkak = (row, opValue) => {
    let list = row.munkak.filter((m) => m.operation === opValue);
    if (activeStage) list = list.filter((m) => m.status === activeStage);
    return list;
  };

  const colTotals = OPERATIONS.map((o) => {
    let kg = 0, count = 0;
    rows.forEach((r) => {
      const list = cellMunkak(r, o.value);
      count += list.length;
      kg += list.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
    });
    return { ...o, kg, count };
  });
  const grandKg = colTotals.reduce((s, c) => s + c.kg, 0);
  const grandCount = colTotals.reduce((s, c) => s + c.count, 0);

  const STAGE_LEGEND = STAGES.filter((s) => s.value !== "megszakitva");

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white"><Layers className="w-4 h-4" /></div>
        </div>
        <div className="hidden md:block shrink-0">
          <h1 className="text-[1rem] font-semibold text-[#1D1D1F] leading-none">Gondozás</h1>
          <p className="text-[0.75rem] text-[#86868B] mt-0.5">Munkák mátrix — partnerek × műveletek, státusz szerint</p>
        </div>
        <div className="flex-1 max-w-md mx-auto md:mx-0 md:ml-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Partner keresése…"
            className="w-full pl-9 h-10 pr-3 rounded-full bg-[#F5F5F7] border border-transparent text-[0.875rem] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
          />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="text-[0.8125rem] font-semibold text-[#1D1D1F]">{grandCount}</span>
          <span className="text-[0.75rem] text-[#86868B]">munka</span>
          <span className="text-[#E5E5EA] mx-1">·</span>
          <span className="text-[0.8125rem] font-semibold text-[#FF9500]">{grandKg.toLocaleString("hu-HU")}</span>
          <span className="text-[0.75rem] text-[#86868B]">kg</span>
        </div>
      </header>

      {/* Státusz jelmagyarázat — interaktív szűrő */}
      <div className="px-4 md:px-6 py-2.5 border-b border-[#E5E5EA] bg-white/40 shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold shrink-0 mr-1">Státusz:</span>
        <button
          onClick={() => setActiveStage(null)}
          className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-medium transition-colors ${activeStage === null ? "bg-[#1D1D1F] text-white" : "bg-[#E5E5EA]/60 text-[#86868B] hover:text-[#1D1D1F]"}`}
        >
          Összes
        </button>
        {STAGE_LEGEND.map((s) => {
          const Icon = s.icon;
          const active = activeStage === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setActiveStage(active ? null : s.value)}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-medium transition-all"
              style={{
                backgroundColor: active ? s.color : s.color + "1A",
                color: active ? "#fff" : s.color,
                ...(active ? { boxShadow: `0 0 0 2px ${s.color}` } : {}),
              }}
            >
              <Icon className="w-3 h-3" /> {s.short}
            </button>
          );
        })}
      </div>

      {/* Partner kijelölő chipek */}
      <div className="px-4 md:px-6 py-2.5 border-b border-[#E5E5EA] bg-white/30 shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold shrink-0 mr-1">Partnerek:</span>
        {searched.length > 0 && (
          <button
            onClick={selectAll}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-medium bg-[#FF9500]/15 text-[#FF9500] hover:bg-[#FF9500]/25 transition-colors"
          >
            Összes ({searched.length})
          </button>
        )}
        {searched.map((r) => {
          const on = effectiveSelected.has(r.id);
          const openCount = r.munkak.filter((m) => !["lezarva", "megszakitva"].includes(m.status)).length;
          return (
            <button
              key={r.id}
              onClick={() => togglePartner(r.id)}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-medium transition-colors ${on ? "bg-[#1D1D1F] text-white" : "bg-[#E5E5EA]/50 text-[#86868B] hover:text-[#1D1D1F]"}`}
            >
              {r.name}
              <span className={`text-[0.625rem] ${on ? "text-white/60" : "text-[#86868B]"}`}>{r.munkak.length}</span>
              {openCount > 0 && <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-[#FF9500]" : "bg-[#FF9500]/60"}`} />}
            </button>
          );
        })}
        {searched.length === 0 && !loading && (
          <span className="text-[0.75rem] text-[#86868B]">Nincs találat.</span>
        )}
      </div>

      {/* Mátrix */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#FF9500] rounded-full animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center mx-auto mb-3"><Layers className="w-7 h-7" /></div>
            <p className="text-[0.9375rem] font-semibold text-[#1D1D1F]">Nincs kijelölt partner</p>
            <p className="text-[0.8125rem] text-[#86868B] mt-1">Jelölj ki partnereket a chipeknél, vagy kattints az „Összes” gombra.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[860px]">
                <thead>
                  <tr className="bg-[#FBFBFD] border-b border-[#E5E5EA]">
                    <th className="sticky left-0 z-10 bg-[#FBFBFD] text-left px-4 py-3 text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold w-48 min-w-[12rem]">
                      Partner
                    </th>
                    {OPERATIONS.map((o) => (
                      <th key={o.value} className="text-left px-3 py-3 text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold min-w-[140px]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                          {o.label}
                        </span>
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold min-w-[90px]">Összes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const rowKg = r.munkak.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
                    const openCount = r.munkak.filter((m) => !["lezarva", "megszakitva"].includes(m.status)).length;
                    return (
                      <tr key={r.id} className="border-b border-[#F2F2F5] hover:bg-[#FBFBFD]/60 transition-colors align-top">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 group">
                          <div className="flex items-start gap-2">
                            <span className="w-8 h-8 rounded-lg bg-[#FF9500]/12 text-[#FF9500] flex items-center justify-center shrink-0 mt-0.5"><Building2 className="w-4 h-4" /></span>
                            <div className="min-w-0">
                              <p className="text-[0.8125rem] font-semibold text-[#1D1D1F] truncate">{r.name}</p>
                              <p className="text-[0.6875rem] text-[#86868B] mt-0.5">{r.munkak.length} munka · {openCount} nyitott</p>
                              <p className="text-[0.6875rem] font-medium text-[#FF9500] mt-0.5">{rowKg.toLocaleString("hu-HU")} kg</p>
                            </div>
                          </div>
                        </td>
                        {OPERATIONS.map((o) => {
                          const list = cellMunkak(r, o.value);
                          const cellKg = list.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
                          return (
                            <td key={o.value} className="px-2.5 py-2.5 align-top">
                              <div className="space-y-1.5">
                                {list.map((m) => {
                                  const stage = stageMeta(m.status);
                                  const StageIcon = stage.icon;
                                  const kg = Number(m.quantity_kg) || 0;
                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() => setSelectedMunkalap(m)}
                                      title={`${m.code} · ${m.project_name || ""} · ${stage.label}`}
                                      className="w-full text-left rounded-lg pl-2 pr-2 py-1.5 flex items-center gap-1.5 hover:shadow-sm hover:scale-[1.02] transition-all"
                                      style={{ backgroundColor: stage.color + "14", borderLeft: `3px solid ${stage.color}` }}
                                    >
                                      <StageIcon className="w-3 h-3 shrink-0" style={{ color: stage.color }} />
                                      <span className="font-mono text-[0.625rem] font-semibold text-[#1D1D1F] truncate">{(m.code || "").split("-").pop()}</span>
                                      {kg > 0 && <span className="text-[0.625rem] text-[#86868B] ml-auto shrink-0">{kg.toLocaleString("hu-HU")} kg</span>}
                                    </button>
                                  );
                                })}
                                {list.length === 0 && (
                                  <div className="text-[0.625rem] text-[#E5E5EA] py-2 text-center">—</div>
                                )}
                                {list.length > 0 && (
                                  <p className="text-[0.625rem] font-medium text-[#86868B] pt-0.5">{cellKg.toLocaleString("hu-HU")} kg</p>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right align-top">
                          <p className="text-[0.875rem] font-semibold text-[#1D1D1F]">{rowKg.toLocaleString("hu-HU")}</p>
                          <p className="text-[0.625rem] text-[#86868B]">kg</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#FBFBFD] border-t-2 border-[#E5E5EA]">
                    <td className="sticky left-0 z-10 bg-[#FBFBFD] px-4 py-3 text-[0.75rem] font-semibold text-[#1D1D1F]">
                      Összesítés
                    </td>
                    {colTotals.map((c) => (
                      <td key={c.value} className="px-3 py-3">
                        <p className="text-[0.8125rem] font-semibold text-[#1D1D1F]">{c.kg.toLocaleString("hu-HU")} kg</p>
                        <p className="text-[0.625rem] text-[#86868B]">{c.count} munka</p>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <p className="text-[0.9375rem] font-bold text-[#FF9500]">{grandKg.toLocaleString("hu-HU")}</p>
                      <p className="text-[0.625rem] text-[#86868B]">kg összesen</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedMunkalap && (
        <MunkalapDetail
          munkalap={selectedMunkalap}
          onClose={() => setSelectedMunkalap(null)}
          onUpdated={(m) => { if (!m) setSelectedMunkalap(null); load(); }}
        />
      )}
    </div>
  );
}