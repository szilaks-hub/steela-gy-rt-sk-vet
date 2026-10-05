import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, Building2, User, Mail, Phone, Briefcase } from "lucide-react";

const emptyKontakt = () => ({ nev: "", beosztas: "", email: "", telefon: "" });

export default function PartnerForm({ open, onOpenChange, initial, onSaved }) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [utca, setUtca] = useState("");
  const [adoszam, setAdoszam] = useState("");
  const [kontaktok, setKontaktok] = useState([emptyKontakt()]);
  const [megjegyzes, setMegjegyzes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setUtca(initial?.utca || "");
      setAdoszam(initial?.adoszam || "");
      const ks = (initial?.kontaktok && initial.kontaktok.length) ? initial.kontaktok.map((k) => ({ ...emptyKontakt(), ...k })) : [emptyKontakt()];
      setKontaktok(ks);
      setMegjegyzes(initial?.megjegyzes || "");
      setError("");
    }
  }, [open, initial]);

  const updateKontakt = (i, field, val) => {
    setKontaktok((prev) => prev.map((k, idx) => (idx === i ? { ...k, [field]: val } : k)));
  };
  const addKontakt = () => setKontaktok((prev) => [...prev, emptyKontakt()]);
  const removeKontakt = (i) => setKontaktok((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!name.trim()) {
      setError("A cégnév megadása kötelező.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const cleanKontaktok = kontaktok
        .map((k) => ({ nev: k.nev.trim(), beosztas: k.beosztas.trim(), email: k.email.trim(), telefon: k.telefon.trim() }))
        .filter((k) => k.nev || k.email || k.telefon);
      const payload = {
        name: name.trim(),
        utca: utca.trim() || undefined,
        adoszam: adoszam.trim() || undefined,
        kontaktok: cleanKontaktok,
        megjegyzes: megjegyzes.trim() || undefined,
      };
      let saved;
      if (initial?.id) {
        saved = await base44.entities.Partner.update(initial.id, payload);
      } else {
        saved = await base44.entities.Partner.create(payload);
      }
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      setError("Hiba mentés közben: " + (e.message || "ismeretlen"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]";

  const fields = (
    <div className="space-y-4 px-5 py-4 overflow-y-auto flex-1 min-h-0">
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#FF9500]" /> Cégnév *
        </Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pl. EVE Debrecen Kft." className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Cím (utca, házszám, város)</Label>
          <Input value={utca} onChange={(e) => setUtca(e.target.value)} placeholder="Pl. Vágóhíd u. 12, Debrecen" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Adószám</Label>
          <Input value={adoszam} onChange={(e) => setAdoszam(e.target.value)} placeholder="12345678-2-09" className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Kontaktok</Label>
          <button type="button" onClick={addKontakt} className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-[#FF9500] hover:text-[#FF6B35]">
            <Plus className="w-3.5 h-3.5" /> Új kontakt
          </button>
        </div>
        <div className="space-y-2.5">
          {kontaktok.map((k, i) => (
            <div key={i} className="rounded-xl border border-[#EDEDF0] bg-[#FBFBFD] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                <Input value={k.nev} onChange={(e) => updateKontakt(i, "nev", e.target.value)} placeholder="Név" className="h-9 rounded-lg bg-white" />
                {kontaktok.length > 1 && (
                  <button type="button" onClick={() => removeKontakt(i)} className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-[#FF6961]/10 hover:text-[#FF6961] flex items-center justify-center shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                  <Input value={k.beosztas} onChange={(e) => updateKontakt(i, "beosztas", e.target.value)} placeholder="Beosztás" className="h-9 rounded-lg bg-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                  <Input type="email" value={k.email} onChange={(e) => updateKontakt(i, "email", e.target.value)} placeholder="E-mail" className="h-9 rounded-lg bg-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#86868B] shrink-0" />
                  <Input value={k.telefon} onChange={(e) => updateKontakt(i, "telefon", e.target.value)} placeholder="Telefon" className="h-9 rounded-lg bg-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Megjegyzés</Label>
        <Textarea value={megjegyzes} onChange={(e) => setMegjegyzes(e.target.value)} rows={2} placeholder="Pl. egyeztetett feltételek, specifikumok…" className="rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]" />
      </div>

      {error && <p className="text-[0.8125rem] text-red-500">{error}</p>}
    </div>
  );

  const footer = (
    <div className="px-5 pb-5 pt-1 flex gap-2.5 shrink-0">
      <button onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
      <button onClick={submit} disabled={saving} className="flex-1 h-11 rounded-xl bg-[#FF9500] hover:bg-[#FF9500]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initial?.id ? "Mentés" : "Partner létrehozása"}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[88vh] flex flex-col gap-0">
          <DrawerHeader className="px-5 pt-3 pb-2 shrink-0">
            <DrawerTitle className="text-[1rem] font-semibold text-[#1D1D1F]">{initial?.id ? "Partner szerkesztése" : "Új partner"}</DrawerTitle>
          </DrawerHeader>
          {fields}
          {footer}
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E5E5EA] shrink-0">
          <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">{initial?.id ? "Partner szerkesztése" : "Új partner"}</DialogTitle>
        </DialogHeader>
        {fields}
        {footer}
      </DialogContent>
    </Dialog>
  );
}