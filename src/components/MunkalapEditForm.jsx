import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS } from "@/lib/munkalapConfig";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function MunkalapEditForm({ munkalap, onSaved, onClose }) {
  const isMobile = useIsMobile();
  const m = munkalap;
  const [customer, setCustomer] = useState(m.customer_name || "");
  const [operation, setOperation] = useState(m.operation || OPERATIONS[0].value);
  const [quantity, setQuantity] = useState(m.quantity_tons != null ? String(m.quantity_tons) : "");
  const [felelos, setFelelos] = useState(m.felelos || "");
  const [tervHatarido, setTervHatarido] = useState(m.terv_hatarido || "");
  const [gyartasiDatum, setGyartasiDatum] = useState(m.gyartasi_datum || "");
  const [kiszallitasiDatum, setKiszallitasiDatum] = useState(m.kiszallitasi_datum || "");
  const [description, setDescription] = useState(m.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!customer.trim()) {
      setError("A vevő megnevezése kötelező.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await base44.entities.Munkalap.update(m.id, {
        customer_name: customer.trim(),
        operation,
        quantity_tons: quantity ? Number(quantity) : 0,
        felelos: felelos.trim(),
        terv_hatarido: tervHatarido || null,
        gyartasi_datum: gyartasiDatum || null,
        kiszallitasi_datum: kiszallitasiDatum || null,
        description: description.trim(),
      });
      onSaved?.(updated);
    } catch (e) {
      setError("Hiba mentés közben: " + (e.message || "ismeretlen"));
    } finally {
      setSaving(false);
    }
  };

  const dateInputClass = "h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]";

  const fields = (
    <div className="space-y-4 px-5 py-4 overflow-y-auto flex-1 min-h-0">
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Vevő megnevezése *</Label>
        <Input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Pl. AcélKft."
          className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Művelet</Label>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Mennyiség (tonna)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className={dateInputClass}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Felelős / Terv feldolgozó</Label>
        <Input
          value={felelos}
          onChange={(e) => setFelelos(e.target.value)}
          placeholder="Ki végzi a terv feldolgozást"
          className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Dátumok</Label>
        <div className="space-y-2.5">
          <div>
            <span className="text-[0.6875rem] text-[#86868B]">Terv feldolgozás határideje (vevő kérés)</span>
            <Input type="date" value={tervHatarido} onChange={(e) => setTervHatarido(e.target.value)} className={dateInputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-[0.6875rem] text-[#86868B]">Gyártási nap</span>
              <Input type="date" value={gyartasiDatum} onChange={(e) => setGyartasiDatum(e.target.value)} className={dateInputClass} />
            </div>
            <div>
              <span className="text-[0.6875rem] text-[#86868B]">Kiszállítás</span>
              <Input type="date" value={kiszallitasiDatum} onChange={(e) => setKiszallitasiDatum(e.target.value)} className={dateInputClass} />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Leírás</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Munka részletei…"
          rows={3}
          className="rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
        />
      </div>
      {error && <p className="text-[0.8125rem] text-red-500">{error}</p>}
    </div>
  );

  const footer = (
    <div className="px-5 pb-5 pt-1 flex gap-2.5 shrink-0">
      <button
        onClick={onClose}
        className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5"
      >
        Mégse
      </button>
      <button
        onClick={save}
        disabled={saving}
        className="flex-1 h-11 rounded-xl bg-[#FF9500] hover:bg-[#FF9500]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mentés"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="h-[88vh] flex flex-col gap-0">
          <DrawerHeader className="px-5 pt-3 pb-2 shrink-0">
            <DrawerTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Munkalap szerkesztése</DrawerTitle>
          </DrawerHeader>
          {fields}
          {footer}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E5E5EA] shrink-0">
          <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Munkalap szerkesztése</DialogTitle>
        </DialogHeader>
        {fields}
        {footer}
      </DialogContent>
    </Dialog>
  );
}