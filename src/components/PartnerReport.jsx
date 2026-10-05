import React from "react";
import { OPERATIONS, STAGES, stageMeta } from "@/lib/munkalapConfig";
import Logo from "@/components/Logo";
import { Printer, X } from "lucide-react";

export default function PartnerReport({ row, onClose }) {
  const { name, partner, munkak } = row;

  const totalKg = munkak.reduce((s, m) => s + (Number(m.quantity_kg) || 0), 0);
  const openCount = munkak.filter((m) => !["lezarva", "megszakitva"].includes(m.status)).length;

  const byStage = STAGES.filter((s) => s.value !== "megszakitva").map((s) => {
    const list = munkak.filter((m) => m.status === s.value);
    return {
      ...s,
      count: list.length,
      kg: list.reduce((sum, m) => sum + (Number(m.quantity_kg) || 0), 0),
    };
  });

  const byOp = OPERATIONS.map((o) => {
    const list = munkak.filter((m) => m.operation === o.value);
    return {
      ...o,
      count: list.length,
      kg: list.reduce((sum, m) => sum + (Number(m.quantity_kg) || 0), 0),
      list: list.sort((a, b) => (a.code || "").localeCompare(b.code || "")),
    };
  }).filter((o) => o.count > 0);

  const today = new Date().toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-auto p-4 md:p-8">
      <div className="w-full max-w-[820px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Toolbar — nem nyomtat */}
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-[#E5E5EA] bg-[#FBFBFD]">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#FF9500]" />
            <span className="text-[0.875rem] font-semibold text-[#1D1D1F]">Gondozási jelentés — {name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#FF9500] text-white text-[0.8125rem] font-semibold hover:bg-[#E68600] transition-colors"
            >
              <Printer className="w-4 h-4" /> Nyomtatás / PDF
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Jelentés tartalom — nyomtat */}
        <div className="print-area px-7 py-6">
          {/* Fejléc */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-[#FF9500]">
            <div className="flex items-center gap-3">
              <Logo variant="full" size={40} />
            </div>
            <div className="text-right">
              <p className="text-[0.8125rem] font-semibold text-[#1D1D1F]">Gondozási jelentés</p>
              <p className="text-[0.6875rem] text-[#86868B] mt-0.5">Készült: {today}</p>
            </div>
          </div>

          {/* Partner adatok */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-[#E5E5EA]">
            <div>
              <p className="text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold mb-1">Partner</p>
              <p className="text-[1rem] font-semibold text-[#1D1D1F]">{name}</p>
              {partner?.utca && <p className="text-[0.75rem] text-[#86868B] mt-0.5">{partner.utca}</p>}
              {partner?.adoszam && <p className="text-[0.75rem] text-[#86868B]">Adószám: {partner.adoszam}</p>}
            </div>
            <div>
              <p className="text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold mb-1">Kontaktok</p>
              {(partner?.kontaktok || []).length > 0 ? (
                <div className="space-y-1">
                  {partner.kontaktok.slice(0, 3).map((k, i) => (
                    <div key={i} className="text-[0.75rem] text-[#1D1D1F]">
                      <span className="font-medium">{k.nev}</span>
                      {k.beosztas && <span className="text-[#86868B]"> · {k.beosztas}</span>}
                      {k.telefon && <span className="text-[#86868B]"> · {k.telefon}</span>}
                      {k.email && <div className="text-[#86868B] text-[0.6875rem]">{k.email}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[0.75rem] text-[#86868B]">Nincs rögzített kontakt.</p>
              )}
            </div>
          </div>

          {/* Összegző sáv */}
          <div className="grid grid-cols-3 gap-3 py-4">
            <div className="rounded-xl bg-[#FF9500]/8 px-4 py-3">
              <p className="text-[1.5rem] font-bold text-[#FF9500] leading-none">{munkak.length}</p>
              <p className="text-[0.6875rem] text-[#86868B] mt-1">munka összesen</p>
            </div>
            <div className="rounded-xl bg-[#34C759]/8 px-4 py-3">
              <p className="text-[1.5rem] font-bold text-[#1D1D1F] leading-none">{openCount}</p>
              <p className="text-[0.6875rem] text-[#86868B] mt-1">nyitott munka</p>
            </div>
            <div className="rounded-xl bg-[#1D1D1F]/5 px-4 py-3">
              <p className="text-[1.5rem] font-bold text-[#1D1D1F] leading-none">{totalKg.toLocaleString("hu-HU")}</p>
              <p className="text-[0.6875rem] text-[#86868B] mt-1">kg összesen</p>
            </div>
          </div>

          {/* Státusz bontás */}
          <div className="pb-4">
            <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2">Státusz bontás</p>
            <div className="flex flex-wrap gap-1.5">
              {byStage.filter((s) => s.count > 0).map((s) => {
                const Icon = s.icon;
                return (
                  <span key={s.value} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-medium" style={{ backgroundColor: s.color + "18", color: s.color }}>
                    <Icon className="w-3 h-3" /> {s.short}: {s.count} · {s.kg.toLocaleString("hu-HU")} kg
                  </span>
                );
              })}
              {byStage.every((s) => s.count === 0) && <span className="text-[0.75rem] text-[#86868B]">Nincs munka.</span>}
            </div>
          </div>

          {/* Munkák táblázat műveletenként */}
          <div className="space-y-4">
            {byOp.map((o) => (
              <div key={o.value}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[0.8125rem] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                    {o.label}
                  </p>
                  <p className="text-[0.6875rem] text-[#86868B]">{o.count} munka · {o.kg.toLocaleString("hu-HU")} kg</p>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#FBFBFD] text-left">
                      <th className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold border-b border-[#E5E5EA]">Kód</th>
                      <th className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold border-b border-[#E5E5EA]">Projekt</th>
                      <th className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold border-b border-[#E5E5EA]">Státusz</th>
                      <th className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold border-b border-[#E5E5EA] text-right">kg</th>
                      <th className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold border-b border-[#E5E5EA]">Határidő</th>
                      <th className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold border-b border-[#E5E5EA]">Felelős</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.list.map((m) => {
                      const stage = stageMeta(m.status);
                      const StageIcon = stage.icon;
                      return (
                        <tr key={m.id} className="border-b border-[#F2F2F5]">
                          <td className="px-2 py-1.5 text-[0.6875rem] font-mono font-semibold text-[#1D1D1F] whitespace-nowrap">{m.code}</td>
                          <td className="px-2 py-1.5 text-[0.6875rem] text-[#1D1D1F]">{m.project_name || "—"}</td>
                          <td className="px-2 py-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium" style={{ backgroundColor: stage.color + "1A", color: stage.color }}>
                              <StageIcon className="w-2.5 h-2.5" /> {stage.short}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-[0.6875rem] text-[#1D1D1F] text-right whitespace-nowrap">{(Number(m.quantity_kg) || 0).toLocaleString("hu-HU")}</td>
                          <td className="px-2 py-1.5 text-[0.6875rem] text-[#86868B] whitespace-nowrap">{m.kert_hatarido || m.gyartasi_datum || "—"}</td>
                          <td className="px-2 py-1.5 text-[0.6875rem] text-[#86868B] whitespace-nowrap">{m.felelos || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            {byOp.length === 0 && <p className="text-[0.8125rem] text-[#86868B] text-center py-6">Nincs munka ehhez a partnerhez.</p>}
          </div>

          {/* Lábléc */}
          <div className="mt-6 pt-3 border-t border-[#E5E5EA] flex items-center justify-between">
            <p className="text-[0.625rem] text-[#86868B]">STEELA Gyártáskövető · made by Szilák Sándor</p>
            <p className="text-[0.625rem] text-[#86868B]">{today}</p>
          </div>
        </div>
      </div>
    </div>
  );
}