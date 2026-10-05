import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { stageMeta } from "@/lib/munkalapConfig";
import PartnerForm from "@/components/PartnerForm";
import PartnerDetail from "@/components/PartnerDetail";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Search, MapPin, Hash, Users, FileText, Loader2 } from "lucide-react";

export default function Partnerek() {
  const [partners, setPartners] = useState([]);
  const [munkalapok, setMunkalapok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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

  // Munkák partnerhez rendelése (case-insensitive név egyezés)
  const munkaByPartner = useMemo(() => {
    const map = {};
    (munkalapok || []).forEach((m) => {
      const key = (m.customer_name || "").toLowerCase();
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [munkalapok]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (partners || [])
      .map((p) => {
        const munkai = munkaByPartner[(p.name || "").toLowerCase()] || [];
        const openCount = munkai.filter((m) => !["lezarva", "megszakitva"].includes(m.status)).length;
        const totalKg = munkai.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
        return { ...p, _munkai: munkai, _openCount: openCount, _totalKg: totalKg };
      })
      .filter((p) => {
        const matchSearch = !q ||
          (p.name || "").toLowerCase().includes(q) ||
          (p.adoszam || "").toLowerCase().includes(q) ||
          (p.utca || "").toLowerCase().includes(q) ||
          (p.kontaktok || []).some((k) =>
            (k.nev || "").toLowerCase().includes(q) ||
            (k.email || "").toLowerCase().includes(q) ||
            (k.telefon || "").toLowerCase().includes(q)
          );
        const matchActive = !onlyActive || p._openCount > 0;
        return matchSearch && matchActive;
      })
      .sort((a, b) => b._openCount - a._openCount || b._munkai.length - a._munkai.length);
  }, [partners, munkaByPartner, search, onlyActive]);

  const onSaved = (saved) => {
    setPartners((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    if (selected && selected.id === saved.id) setSelected(saved);
  };

  const onDelete = async () => {
    try {
      await base44.entities.Partner.delete(selected.id);
      setPartners((prev) => prev.filter((p) => p.id !== selected.id));
      setSelected(null);
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white"><Building2 className="w-4 h-4" /></div>
        </div>
        <div className="hidden md:block shrink-0">
          <h1 className="text-[1rem] font-semibold text-[#1D1D1F] leading-none">Partnerek</h1>
          <p className="text-[0.75rem] text-[#86868B] mt-0.5">Cégek, kontaktok és munkák egy helyen</p>
        </div>
        <div className="flex-1 max-w-md mx-auto md:mx-0 md:ml-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Keresés cégnév, adószám, kontakt…" className="pl-9 h-10 rounded-full bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]" />
        </div>
        <button
          onClick={() => setOnlyActive((v) => !v)}
          className={`hidden sm:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[0.8125rem] font-medium transition-colors shrink-0 ${onlyActive ? "bg-[#FF9500] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]"}`}
        >
          Csak aktív
        </button>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1D1D1F] text-white text-[0.875rem] font-medium hover:bg-[#1D1D1F]/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Új partner
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#FF9500] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center mx-auto mb-3"><Building2 className="w-7 h-7" /></div>
            <p className="text-[0.9375rem] font-semibold text-[#1D1D1F]">{search || onlyActive ? "Nincs találat" : "Még nincs partner rögzítve"}</p>
            <p className="text-[0.8125rem] text-[#86868B] mt-1">{search || onlyActive ? "Próbáld módosítani a szűrőt." : "Add hozzá az első partnert, hogy a munkáknál kiválasztható legyen."}</p>
            {!search && !onlyActive && (
              <button onClick={() => { setEditing(null); setFormOpen(true); }} className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#FF9500] text-white text-[0.875rem] font-medium hover:bg-[#FF9500]/90">
                <Plus className="w-4 h-4" /> Új partner
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const kontaktCount = (p.kontaktok || []).length;
              const aktiveStage = p._munkai.length > 0 ? stageMeta(p._munkai[p._munkai.length - 1].status) : null;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="text-left rounded-2xl bg-white border border-[#E5E5EA] p-4 hover:border-[#FF9500]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-2.5 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9500]/15 to-[#FFCC00]/15 text-[#FF9500] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.875rem] font-semibold text-[#1D1D1F] truncate">{p.name}</p>
                      {p.utca && <p className="text-[0.6875rem] text-[#86868B] truncate flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0" /> {p.utca}</p>}
                    </div>
                    {p._openCount > 0 && (
                      <span className="shrink-0 text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-[#FF9500]/15 text-[#FF9500]">{p._openCount} nyitott</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[0.6875rem] text-[#86868B]">
                    {p.adoszam && <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" /> {p.adoszam}</span>}
                    {kontaktCount > 0 && <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {kontaktCount} kontakt</span>}
                    <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> {p._munkai.length} munka</span>
                  </div>
                  {p._totalKg > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#F2F2F5] flex items-center justify-between">
                      <span className="text-[0.6875rem] text-[#86868B]">Összes kg</span>
                      <span className="text-[0.8125rem] font-semibold text-[#FF9500]">{p._totalKg.toLocaleString("hu-HU")} kg</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <PartnerDetail
          partner={selected}
          munkalapok={munkalapok}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setFormOpen(true); }}
          onDelete={onDelete}
        />
      )}
      <PartnerForm open={formOpen} onOpenChange={setFormOpen} initial={editing} onSaved={onSaved} />
    </div>
  );
}