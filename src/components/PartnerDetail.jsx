import React, { useState, useMemo } from "react";
import { STAGES, stageMeta, operationLabel, operationColor, formatDate, deadlineStatus } from "@/lib/munkalapConfig";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Building2, MapPin, Hash, Pencil, Trash2, Mail, Phone, Briefcase, User,
  Search, FileText, Scale, AlertTriangle, CheckCircle2,
} from "lucide-react";

const STAGE_FILTERS = [
  { value: "osszes", label: "Összes" },
  ...STAGES.map((s) => ({ value: s.value, label: s.short })),
];

export default function PartnerDetail({ partner, munkalapok, onClose, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("osszes");
  const [confirmDel, setConfirmDel] = useState(false);

  const p = partner;
  const munkai = useMemo(
    () => (munkalapok || []).filter((m) => (m.customer_name || "").toLowerCase() === (p.name || "").toLowerCase()),
    [munkalapok, p.name]
  );

  const filtered = useMemo(
    () => munkai.filter((m) => {
      const matchSearch = !search ||
        (m.code || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.project_name || "").toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "osszes" || m.status === stageFilter;
      return matchSearch && matchStage;
    }),
    [munkai, search, stageFilter]
  );

  const totalKg = munkai.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
  const openCount = munkai.filter((m) => !["lezarva", "megszakitva"].includes(m.status)).length;
  const lezarvaCount = munkai.filter((m) => m.status === "lezarva").length;
  const megszakitvaCount = munkai.filter((m) => m.status === "megszakitva").length;

  const stageBreakdown = STAGES.map((s) => ({
    ...s,
    count: munkai.filter((m) => m.status === s.value).length,
    kg: munkai.filter((m) => m.status === s.value).reduce((sum, m) => sum + (Number(m.quantity_kg) || 0), 0),
  })).filter((s) => s.count > 0);

  const kontaktok = p.kontaktok || [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <div className="shrink-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9500] to-[#FFCC00]" />
          <div className="px-5 pt-3 pb-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={onClose} className="shrink-0 w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-[#1D1D1F] transition-colors" title="Bezárás">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-[1rem] font-semibold text-[#1D1D1F] truncate">{p.name}</h2>
                  <p className="text-[0.75rem] text-[#86868B] truncate">{munkai.length} munka · {totalKg.toLocaleString("hu-HU")} kg összesen</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={onEdit} className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] flex items-center justify-center transition-colors" title="Szerkesztés">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setConfirmDel(true)} className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-[#FF6961]/10 hover:text-[#FF6961] flex items-center justify-center transition-colors" title="Törlés">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Cégadatok */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {p.utca && (
              <div className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-3">
                <span className="w-7 h-7 rounded-lg bg-[#5B9BD5]/12 text-[#5B9BD5] flex items-center justify-center mb-2"><MapPin className="w-3.5 h-3.5" /></span>
                <p className="text-[0.6875rem] text-[#86868B]">Cím</p>
                <p className="text-[0.8125rem] font-medium text-[#1D1D1F] mt-0.5">{p.utca}</p>
              </div>
            )}
            {p.adoszam && (
              <div className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-3">
                <span className="w-7 h-7 rounded-lg bg-[#FF9500]/12 text-[#FF9500] flex items-center justify-center mb-2"><Hash className="w-3.5 h-3.5" /></span>
                <p className="text-[0.6875rem] text-[#86868B]">Adószám</p>
                <p className="text-[0.8125rem] font-medium text-[#1D1D1F] mt-0.5 font-mono">{p.adoszam}</p>
              </div>
            )}
            <div className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-3">
              <span className="w-7 h-7 rounded-lg bg-[#34C759]/12 text-[#34C759] flex items-center justify-center mb-2"><FileText className="w-3.5 h-3.5" /></span>
              <p className="text-[0.6875rem] text-[#86868B]">Munkák</p>
              <p className="text-[0.8125rem] font-medium text-[#1D1D1F] mt-0.5">{munkai.length} db</p>
            </div>
          </div>

          {/* KPI sáv */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-[#FF9500]/10 px-3 py-2.5">
              <p className="text-[0.6875rem] text-[#86868B]">Nyitott</p>
              <p className="text-[1.125rem] font-semibold text-[#FF9500]">{openCount}</p>
            </div>
            <div className="rounded-xl bg-[#8E8E93]/10 px-3 py-2.5">
              <p className="text-[0.6875rem] text-[#86868B]">Lezárva</p>
              <p className="text-[1.125rem] font-semibold text-[#8E8E93]">{lezarvaCount}</p>
            </div>
            <div className="rounded-xl bg-[#FF6961]/10 px-3 py-2.5">
              <p className="text-[0.6875rem] text-[#86868B]">Megszakítva</p>
              <p className="text-[1.125rem] font-semibold text-[#FF6961]">{megszakitvaCount}</p>
            </div>
          </div>

          {/* Kontaktok */}
          {kontaktok.length > 0 && (
            <div>
              <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5 inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Kontaktok
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {kontaktok.map((k, i) => (
                  <div key={i} className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#AF52DE]/12 text-[#AF52DE] flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5" /></span>
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] font-semibold text-[#1D1D1F] truncate">{k.nev || "Névtelen"}</p>
                        {k.beosztas && <p className="text-[0.6875rem] text-[#86868B] truncate">{k.beosztas}</p>}
                      </div>
                    </div>
                    {k.email && (
                      <a href={`mailto:${k.email}`} className="flex items-center gap-1.5 text-[0.75rem] text-[#0A84FF] hover:underline truncate">
                        <Mail className="w-3 h-3 shrink-0" /> {k.email}
                      </a>
                    )}
                    {k.telefon && (
                      <a href={`tel:${k.telefon}`} className="flex items-center gap-1.5 text-[0.75rem] text-[#1D1D1F] hover:underline">
                        <Phone className="w-3 h-3 shrink-0" /> {k.telefon}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Státusz bontás */}
          {stageBreakdown.length > 0 && (
            <div>
              <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5">Munkák státusza</p>
              <div className="flex flex-wrap gap-1.5">
                {stageBreakdown.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setStageFilter(stageFilter === s.value ? "osszes" : s.value)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[0.75rem] font-medium transition-all ${stageFilter === s.value ? "ring-2" : ""}`}
                      style={{ backgroundColor: s.color + "1A", color: s.color, ...(stageFilter === s.value ? { boxShadow: `0 0 0 2px ${s.color}` } : {}) }}
                    >
                      <Icon className="w-3.5 h-3.5" /> {s.short} <span className="font-semibold">{s.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {p.megjegyzes && (
            <div>
              <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2">Megjegyzés</p>
              <p className="text-[0.8125rem] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap rounded-2xl bg-[#FBFBFD] border border-[#EDEDF0] p-3.5">{p.megjegyzes}</p>
            </div>
          )}

          {/* Munkák listája */}
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5">Munkák ({filtered.length})</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Keresés kód vagy projekt…" className="pl-9 h-10 rounded-full bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]" />
            </div>
            <div className="space-y-2">
              {filtered.length === 0 && (
                <div className="text-center text-[0.8125rem] text-[#86868B] py-10 border border-dashed border-[#E5E5EA] rounded-xl">
                  {munkai.length === 0 ? "Még nincs munka ehhez a partnerhez" : "Nincs találat a szűrésre"}
                </div>
              )}
              {filtered.map((m) => {
                const stage = stageMeta(m.status);
                const StageIcon = stage.icon;
                const opCol = operationColor(m.operation);
                const dl = deadlineStatus(m.kert_hatarido);
                return (
                  <div key={m.id} className="rounded-xl border border-[#EDEDF0] bg-white px-3.5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] font-mono font-semibold text-[#1D1D1F] truncate">{m.code}</p>
                        <p className="text-[0.75rem] text-[#1D1D1F] truncate">{m.project_name}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold shrink-0" style={{ backgroundColor: stage.color + "1A", color: stage.color }}>
                        <StageIcon className="w-3 h-3" /> {stage.short}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[0.6875rem] text-[#86868B]">
                      <span className="inline-flex items-center gap-1" style={{ color: opCol }}><Scale className="w-3 h-3" /> {(Number(m.quantity_kg) || 0).toLocaleString("hu-HU")} kg</span>
                      <span className="inline-flex items-center gap-1">{operationLabel(m.operation)}</span>
                      {m.kert_hatarido && (
                        <span className="inline-flex items-center gap-1 ml-auto" style={{ color: dl?.color || "#86868B" }}>
                          {dl?.diff < 0 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {formatDate(m.kert_hatarido)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {confirmDel && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-9 h-9 rounded-full bg-[#FF6961]/15 text-[#FF6961] flex items-center justify-center"><Trash2 className="w-4 h-4" /></span>
                <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F]">Partner törlése</h3>
              </div>
              <p className="text-[0.8125rem] text-[#86868B] mb-4">A partner törlése nem érinti a hozzá tartozó munkákat — azok megmaradnak, csak a partneradat vész el. Biztosan törlöd?</p>
              <div className="flex gap-2.5">
                <button onClick={() => setConfirmDel(false)} className="flex-1 h-10 rounded-xl text-[0.8125rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
                <button onClick={() => { setConfirmDel(false); onDelete(); }} className="flex-1 h-10 rounded-xl bg-[#FF6961] text-white text-[0.8125rem] font-medium hover:bg-[#FF6961]/90">Törlés</button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}