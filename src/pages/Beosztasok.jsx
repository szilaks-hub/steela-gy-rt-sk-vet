import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Users, X, Loader2, UserPlus } from "lucide-react";
import { operationColor, operationLabel, stageMeta } from "@/lib/munkalapConfig";

const STATUS = [
  { value: "elerheto", label: "Elérhető", color: "#34C759" },
  { value: "foglalt", label: "Foglalt", color: "#FF9500" },
  { value: "szabadsagon", label: "Szabadságon", color: "#5B9BD5" },
  { value: "inaktiv", label: "Inaktív", color: "#86868B" },
];
const statusMeta = (v) => STATUS.find((s) => s.value === v) || STATUS[0];

export default function Beosztasok() {
  const { toast } = useToast();
  const [munkasok, setMunkasok] = useState([]);
  const [munkalapok, setMunkalapok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ms, ml] = await Promise.all([
        base44.entities.Munkas.list("-created_date", 500),
        base44.entities.Munkalap.list("-created_date", 500),
      ]);
      setMunkasok(ms);
      setMunkalapok(ml.filter((m) => !m.archived && m.status !== "felrakva_kesz"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const assignedTo = (munkalap, munkasId) =>
    Array.isArray(munkalap.munkasok) && munkalap.munkasok.includes(munkasId);

  const removeAssign = async (munkalap, munkasId) => {
    setBusyId(munkalap.id);
    try {
      const updated = await base44.entities.Munkalap.update(munkalap.id, {
        munkasok: (munkalap.munkasok || []).filter((id) => id !== munkasId),
      });
      setMunkalapok((prev) => prev.map((m) => (m.id === munkalap.id ? updated : m)));
    } finally {
      setBusyId(null);
    }
  };

  const assign = async (munkalap, munkasId) => {
    if (!munkasId) return;
    setBusyId(munkalap.id);
    try {
      const next = Array.isArray(munkalap.munkasok) ? [...munkalap.munkasok] : [];
      if (!next.includes(munkasId)) next.push(munkasId);
      const updated = await base44.entities.Munkalap.update(munkalap.id, { munkasok: next });
      setMunkalapok((prev) => prev.map((m) => (m.id === munkalap.id ? updated : m)));
      toast({ title: "Munkatárs ráosztva" });
    } finally {
      setBusyId(null);
    }
  };

  const unassigned = munkalapok.filter(
    (m) => !Array.isArray(m.munkasok) || m.munkasok.length === 0
  );

  const MunkalapChip = ({ munkalap, onRemove, munkasId }) => {
    const sm = stageMeta(munkalap.status);
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#EDEDF0] bg-white px-2.5 py-2">
        <span className="w-1.5 h-7 rounded-full shrink-0" style={{ backgroundColor: operationColor(munkalap.operation) }} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold text-[#1D1D1F] truncate">{munkalap.code}</p>
          <p className="text-[0.6875rem] text-[#86868B] truncate">{munkalap.customer_name}</p>
        </div>
        <span
          className="inline-flex items-center text-[0.625rem] font-medium px-1.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: sm.color + "1A", color: sm.color }}
        >
          {sm.short}
        </span>
        {onRemove && (
          <button
            onClick={() => onRemove(munkalap, munkasId)}
            disabled={busyId === munkalap.id}
            className="w-6 h-6 rounded-full text-[#86868B] hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center disabled:opacity-50 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-[1rem] font-semibold text-[#1D1D1F] leading-none">Beosztások</h1>
            <p className="text-[0.75rem] text-[#86868B] mt-0.5">Munkatársak ráosztása munkalapokra</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#FF9500] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {munkasok.map((mk) => {
                const sm = statusMeta(mk.status);
                const assigned = munkalapok.filter((m) => assignedTo(m, mk.id));
                return (
                  <div key={mk.id} className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[0.8125rem] font-semibold shrink-0"
                        style={{ backgroundColor: sm.color }}
                      >
                        {(mk.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.875rem] font-semibold text-[#1D1D1F] truncate">{mk.name}</p>
                        <p className="text-[0.6875rem] text-[#86868B] truncate">{mk.role || sm.label}</p>
                      </div>
                      <span className="text-[0.6875rem] font-semibold text-[#86868B] shrink-0">{assigned.length} db</span>
                    </div>
                    <div className="space-y-1.5">
                      {assigned.length === 0 ? (
                        <p className="text-[0.8125rem] text-[#86868B] italic">Nincs ráosztott munkalap</p>
                      ) : (
                        assigned.map((m) => (
                          <MunkalapChip
                            key={m.id}
                            munkalap={m}
                            munkasId={mk.id}
                            onRemove={removeAssign}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
              {munkasok.length === 0 && (
                <p className="text-[0.8125rem] text-[#86868B] col-span-full">
                  Még nincs munkatárs. Add hozzá a Munkatársak oldalon.
                </p>
              )}
            </div>

            {unassigned.length > 0 && (
              <div>
                <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5 inline-flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Beosztásra vár ({unassigned.length})
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {unassigned.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-dashed border-[#E5E5EA] bg-white p-3">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="w-1.5 h-7 rounded-full shrink-0" style={{ backgroundColor: operationColor(m.operation) }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.8125rem] font-semibold text-[#1D1D1F] truncate">{m.code}</p>
                          <p className="text-[0.6875rem] text-[#86868B] truncate">{m.customer_name}</p>
                        </div>
                      </div>
                      <Select onValueChange={(v) => assign(m, v)}>
                        <SelectTrigger className="h-9 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
                          <span className="text-[#86868B] inline-flex items-center gap-1.5">
                            <UserPlus className="w-3.5 h-3.5" /> Munkatárs ráosztása
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {munkasok.map((mk) => (
                            <SelectItem key={mk.id} value={mk.id}>
                              {mk.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}