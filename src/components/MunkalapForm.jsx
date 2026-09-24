import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, progressFor } from "@/lib/munkalapConfig";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Loader2, X, FileText, User, Sparkles } from "lucide-react";

const sanitizePrefix = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase();

const yearOf = (dateStr) => (dateStr && dateStr.length >= 4 ? dateStr.substring(0, 4) : String(new Date().getFullYear()));

export default function MunkalapForm({ onCreated }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [projectName, setProjectName] = useState("");
  const [operation, setOperation] = useState(OPERATIONS[0].value);
  const [quantity, setQuantity] = useState("");
  const [felelos, setFelelos] = useState("");
  const [gyartasraMegy, setGyartasraMegy] = useState(false);
  const [phaseDatum, setPhaseDatum] = useState("");
  const [gyartasiDatum, setGyartasiDatum] = useState("");
  const [kiszallitasiDatum, setKiszallitasiDatum] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [letrehozo, setLetrehozo] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        let name = me?.full_name || me?.email || "";
        if (me?.email) {
          const munkasok = await base44.entities.Munkas.list("-created_date", 500);
          const match = (munkasok || []).find(
            (m) => (m.email || "").toLowerCase() === me.email.toLowerCase()
          );
          if (match?.name) name = match.name;
        }
        if (active) setLetrehozo(name);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const previewCode = useMemo(() => {
    const prefix = sanitizePrefix(customer) || "XXX";
    const year = yearOf(gyartasraMegy ? gyartasiDatum || phaseDatum : phaseDatum);
    return `${prefix}-${year}`;
  }, [customer, gyartasraMegy, phaseDatum, gyartasiDatum]);

  const reset = () => {
    setCustomer("");
    setProjectName("");
    setOperation(OPERATIONS[0].value);
    setQuantity("");
    setFelelos("");
    setGyartasraMegy(false);
    setPhaseDatum("");
    setGyartasiDatum("");
    setKiszallitasiDatum("");
    setDescription("");
    setFiles([]);
    setError("");
  };

  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...list]);
  };

  const submit = async () => {
    if (!customer.trim()) {
      setError("A vevő megnevezése kötelező.");
      return;
    }
    if (!projectName.trim()) {
      setError("A projekt megnevezése kötelező.");
      return;
    }
    if (gyartasraMegy && !gyartasiDatum) {
      setError("Gyártásra menő munkalapnál a gyártási nap kötelező.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const docUrls = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        docUrls.push(file_url);
      }
      const existing = await base44.entities.Munkalap.list("-created_date", 500);
      const prefix = sanitizePrefix(customer) || "XXX";
      const year = yearOf(gyartasraMegy ? gyartasiDatum || phaseDatum : phaseDatum);
      let code = `${prefix}-${year}`;
      if ((existing || []).some((m) => m.code === code)) {
        let n = 2;
        while ((existing || []).some((m) => m.code === `${code}-${String(n).padStart(2, "0")}`)) n++;
        code = `${code}-${String(n).padStart(2, "0")}`;
      }
      const created = await base44.entities.Munkalap.create({
        code,
        customer_name: customer.trim(),
        project_name: projectName.trim(),
        letrehozo_nev: letrehozo || undefined,
        operation,
        quantity_kg: quantity ? Number(quantity) : 0,
        status: "terv_feldolgozas",
        accepted: false,
        documents: docUrls,
        progress: progressFor("terv_feldolgozas"),
        description: description.trim(),
        felelos: felelos.trim(),
        gyartasra_megy: gyartasraMegy,
        phase_datum: !gyartasraMegy && phaseDatum ? phaseDatum : undefined,
        gyartasi_datum: gyartasraMegy && gyartasiDatum ? gyartasiDatum : undefined,
        kiszallitasi_datum: gyartasraMegy && kiszallitasiDatum ? kiszallitasiDatum : undefined,
        stage_history: [{ stage: "terv_feldolgozas", at: new Date().toISOString(), note: "Munkalap létrehozva" }],
      });
      reset();
      setOpen(false);
      onCreated?.(created);
    } catch (e) {
      setError("Hiba mentés közben: " + (e.message || "ismeretlen"));
    } finally {
      setSaving(false);
    }
  };

  const trigger = isMobile ? (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9500] to-[#FFCC00] text-white shadow-lg shadow-[#FF9500]/30 flex items-center justify-center active:scale-95 transition-transform"
      title="Új munkalap"
    >
      <Plus className="w-6 h-6" />
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1D1D1F] text-white text-[0.875rem] font-medium hover:bg-[#1D1D1F]/90 transition-colors shrink-0"
    >
      <Plus className="w-4 h-4" /> Új Munkalap
    </button>
  );

  const inputClass = "h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]";

  const fields = (
    <div className="space-y-4 px-5 py-4 overflow-y-auto flex-1 min-h-0">
      {/* Létrehozó – automatikus */}
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#FF9500]" /> Létrehozó (automatikus)
        </Label>
        <div className="h-11 rounded-xl bg-[#FF9500]/8 border border-[#FF9500]/20 px-3 flex items-center text-[0.875rem] text-[#1D1D1F] font-medium">
          {letrehozo || <span className="text-[#86868B]">betöltés…</span>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Vevő megnevezése *</Label>
        <Input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Pl. AcélKft."
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Projekt megnevezése *</Label>
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Pl. Kerítés panel sorozat"
          className={inputClass}
        />
      </div>

      {/* Beszélő kód előnézet */}
      <div className="flex items-center gap-2 rounded-xl bg-[#1D1D1F]/5 px-3 py-2.5">
        <Sparkles className="w-4 h-4 text-[#FF9500] shrink-0" />
        <span className="text-[0.6875rem] text-[#86868B]">Generált kód</span>
        <span className="ml-auto text-[0.8125rem] font-semibold text-[#1D1D1F] tracking-wide">{previewCode}</span>
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
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Mennyiség (kg)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Felelős / Terv feldolgozó</Label>
        <Input
          value={felelos}
          onChange={(e) => setFelelos(e.target.value)}
          placeholder="Ki végzi a terv feldolgozást"
          className={inputClass}
        />
      </div>

      {/* Dátumok – ajánlati vagy gyártható */}
      <div className="space-y-2.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Dátumok</Label>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={gyartasraMegy}
            onChange={(e) => setGyartasraMegy(e.target.checked)}
            className="w-4 h-4 rounded accent-[#FF9500]"
          />
          <span className="text-[0.8125rem] text-[#1D1D1F] font-medium">Gyártásra megy</span>
          <span className="text-[0.6875rem] text-[#86868B]">
            {gyartasraMegy ? "(gyártható)" : "(még csak ajánlati szakasz)"}
          </span>
        </label>

        {!gyartasraMegy ? (
          <div>
            <span className="text-[0.6875rem] text-[#86868B]">Ajánlati határidő</span>
            <Input type="date" value={phaseDatum} onChange={(e) => setPhaseDatum(e.target.value)} className={inputClass} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-[0.6875rem] text-[#86868B]">Gyártási nap *</span>
              <Input type="date" value={gyartasiDatum} onChange={(e) => setGyartasiDatum(e.target.value)} className={inputClass} />
            </div>
            <div>
              <span className="text-[0.6875rem] text-[#86868B]">Kiszállítás</span>
              <Input type="date" value={kiszallitasiDatum} onChange={(e) => setKiszallitasiDatum(e.target.value)} className={inputClass} />
            </div>
          </div>
        )}
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
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Dokumentumok (tervek, rajzok)</Label>
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E5EA] p-5 cursor-pointer hover:border-[#FF9500]/50 transition-colors">
          <Upload className="w-5 h-5 text-[#86868B]" />
          <span className="text-[0.8125rem] text-[#86868B]">Fájlok kiválasztása</span>
          <input type="file" multiple className="hidden" onChange={handleFiles} />
        </label>
        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-[#F5F5F7] px-3 py-2">
                <FileText className="w-4 h-4 text-[#FF9500] shrink-0" />
                <span className="flex-1 text-[0.8125rem] text-[#1D1D1F] truncate">{f.name}</span>
                <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X className="w-4 h-4 text-[#86868B] hover:text-[#1D1D1F]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-[0.8125rem] text-red-500">{error}</p>}
    </div>
  );

  const footer = (
    <div className="px-5 pb-5 pt-1 flex gap-2.5 shrink-0">
      <button
        onClick={() => setOpen(false)}
        className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5"
      >
        Mégse
      </button>
      <button
        onClick={submit}
        disabled={saving}
        className="flex-1 h-11 rounded-xl bg-[#FF9500] hover:bg-[#FF9500]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Létrehozás"}
      </button>
    </div>
  );

  return (
    <>
      {trigger}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="h-[88vh] flex flex-col gap-0">
            <DrawerHeader className="px-5 pt-3 pb-2 shrink-0">
              <DrawerTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Új munkalap</DrawerTitle>
            </DrawerHeader>
            {fields}
            {footer}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E5E5EA] shrink-0">
              <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Új munkalap</DialogTitle>
            </DialogHeader>
            {fields}
            {footer}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}