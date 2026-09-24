import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Minus, Trash2, Loader2, Scale } from "lucide-react";
import { logAudit } from "@/lib/auditLog";
import { formatDate } from "@/lib/munkalapConfig";

export default function KgModositasPanel({ munkalap }) {
  const m = munkalap;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [irany, setIrany] = useState("plus");
  const [kg, setKg] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.KgModositas.list("-created_date", 500);
      setItems(all.filter((i) => i.munkalap_id === m.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [m.id]);

  const plusKg = items.filter((i) => i.irany === "plus").reduce((s, i) => s + (Number(i.mennyiseg_kg) || 0), 0);
  const minusKg = items.filter((i) => i.irany === "minus").reduce((s, i) => s + (Number(i.mennyiseg_kg) || 0), 0);
  const net = plusKg - minusKg;
  const eredeti = Number(m.quantity_kg) || 0;
  const vegso = eredeti + net;

  const submit = async () => {
    const val = Number(kg);
    if (!val || val <= 0) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await base44.entities.KgModositas.create({
        munkalap_id: m.id,
        munkalap_code: m.code,
        customer_name: m.customer_name,
        irany,
        mennyiseg_kg: val,
        note: note.trim() || undefined,
        datum: today,
      });
      logAudit({
        action: "edit",
        munkalap_id: m.id,
        munkalap_code: m.code,
        note: `Kg korrekció: ${irany === "plus" ? "+" : "−"}${val} kg${note ? " — " + note : ""}`,
      });
      setKg("");
      setNote("");
      setIrany("plus");
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    await base44.entities.KgModositas.delete(item.id);
    load();
  };

  return (
    <div className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold inline-flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" /> Kg korrekció (+/−)
        </p>
        <span className="text-[0.6875rem] text-[#86868B]">Lezárt munka utólagos kg rögzítése</span>
      </div>

      {/* Big +/- buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setIrany("plus")}
          className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all ${irany === "plus" ? "border-[#34C759] bg-[#34C759]/10 text-[#34C759]" : "border-[#E5E5EA] bg-white text-[#86868B] hover:border-[#34C759]/40"}`}
        >
          <Plus className="w-7 h-7" />
          <span className="text-[0.75rem] font-semibold">Hozzáadás</span>
        </button>
        <button
          onClick={() => setIrany("minus")}
          className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all ${irany === "minus" ? "border-[#FF6961] bg-[#FF6961]/10 text-[#FF6961]" : "border-[#E5E5EA] bg-white text-[#86868B] hover:border-[#FF6961]/40"}`}
        >
          <Minus className="w-7 h-7" />
          <span className="text-[0.75rem] font-semibold">Levonás</span>
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          placeholder="kg érték"
          className="h-11 rounded-xl bg-white border border-[#E5E5EA] px-3 text-[0.875rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9500]"
        />
        <button
          onClick={submit}
          disabled={saving || !kg}
          className="h-11 px-5 rounded-xl bg-[#1D1D1F] text-white text-[0.8125rem] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rögzít"}
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Megjegyzés (opcionális)"
        className="w-full h-10 rounded-xl bg-white border border-[#E5E5EA] px-3 text-[0.8125rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9500]"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[#34C759]/10 py-2">
          <p className="text-[0.625rem] text-[#86868B]">+ Hozzáadva</p>
          <p className="text-[0.9375rem] font-semibold text-[#34C759]">{plusKg.toLocaleString("hu-HU")}</p>
        </div>
        <div className="rounded-xl bg-[#FF6961]/10 py-2">
          <p className="text-[0.625rem] text-[#86868B]">− Levonva</p>
          <p className="text-[0.9375rem] font-semibold text-[#FF6961]">{minusKg.toLocaleString("hu-HU")}</p>
        </div>
        <div className="rounded-xl bg-[#FF9500]/10 py-2">
          <p className="text-[0.625rem] text-[#86868B]">Netto</p>
          <p className="text-[0.9375rem] font-semibold text-[#FF9500]">{net.toLocaleString("hu-HU")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-white border border-[#E5E5EA] px-3 py-2">
        <span className="text-[0.75rem] text-[#86868B]">Eredeti → Végső</span>
        <span className="text-[0.8125rem] font-semibold text-[#1D1D1F]">
          {eredeti.toLocaleString("hu-HU")} → <span className="text-[#FF9500]">{vegso.toLocaleString("hu-HU")} kg</span>
        </span>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {loading && <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-[#86868B]" /></div>}
        {!loading && items.length === 0 && <p className="text-center text-[0.75rem] text-[#86868B] py-3">Még nincs rögzített korrekció</p>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E5EA] px-3 py-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${it.irany === "plus" ? "bg-[#34C759]/10 text-[#34C759]" : "bg-[#FF6961]/10 text-[#FF6961]"}`}>
              {it.irany === "plus" ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[0.8125rem] font-semibold text-[#1D1D1F]">{it.irany === "plus" ? "+" : "−"}{Number(it.mennyiseg_kg).toLocaleString("hu-HU")} kg</p>
              <p className="text-[0.6875rem] text-[#86868B] truncate">{formatDate(it.datum)}{it.note ? ` · ${it.note}` : ""}</p>
            </div>
            <button onClick={() => remove(it)} className="w-7 h-7 rounded-lg text-[#86868B] hover:bg-[#FF6961]/10 hover:text-[#FF6961] flex items-center justify-center shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}