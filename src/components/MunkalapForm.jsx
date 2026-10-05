import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, KERES_TIPUSOK, progressFor } from "@/lib/munkalapConfig";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Loader2, X, FileText, User, AlertTriangle } from "lucide-react";
import FelelosSelect from "@/components/FelelosSelect";
import PartnerSelect from "@/components/PartnerSelect";
import { logAudit } from "@/lib/auditLog";

const genCode = async () => {
  const today = new Date();
  const yy = String(today.getFullYear()).slice(-2);
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `ST-${yy}${mm}${dd}`;
  const existing = await base44.entities.Munkalap.list("-created_date", 500);
  const nums = (existing || [])
    .filter((m) => (m.code || "").startsWith(prefix))
    .map((m) => parseInt((m.code || "").split("-")[2] || "0", 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
};

export default function MunkalapForm({ onCreated }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [projectName, setProjectName] = useState("");
  const [keresTipus, setKeresTipus] = useState(KERES_TIPUSOK[0].value);
  const [operation, setOperation] = useState(OPERATIONS[0].value);
  const [quantity, setQuantity] = useState("");
  const [felelos, setFelelos] = useState("");
  const [kertHatarido, setKertHatarido] = useState("");
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

  const reset = () => {
    setCustomer("");
    setProjectName("");
    setKeresTipus(KERES_TIPUSOK[0].value);
    setOperation(OPERATIONS[0].value);
    setQuantity("");
    setFelelos("");
    setKertHatarido("");
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
    setSaving(true);
    setError("");
    try {
      const docUrls = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        docUrls.push(file_url);
      }
      const code = await genCode();
      const created = await base44.entities.Munkalap.create({
        code,
        customer_name: customer.trim(),
        project_name: projectName.trim(),
        letrehozo_nev: letrehozo || undefined,
        kereskedo: letrehozo || undefined,
        keres_tipus: keresTipus,
        operation,
        quantity_kg: quantity ? Number(quantity) : 0,
        status: "munkakeres",
        kert_hatarido: kertHatarido || undefined,
        felelos: felelos.trim() || undefined,
        description: description.trim(),
        documents: docUrls,
        progress: progressFor("munkakeres"),
        stage_history: [{ stage: "munkakeres", at: new Date().toISOString(), note: "Munkakérés létrehozva", actor: letrehozo || "" }],
      });
      logAudit({
        action: "create",
        munkalap_id: created.id,
        munkalap_code: created.code,
        quantity_kg: created.quantity_kg,
        note: `${created.customer_name} — ${created.project_name}`,
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
      title="Új munkakérés"
    >
      <Plus className="w-6 h-6" />
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1D1D1F] text-white text-[0.875rem] font-medium hover:bg-[#1D1D1F]/90 transition-colors shrink-0"
    >
      <Plus className="w-4 h-4" /> Új Munkakérés
    </button>
  );

  const inputClass = "h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]";

  const fields = (
    <div className="space-y-4 px-5 py-4 overflow-y-auto flex-1 min-h-0">
      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#FF9500]" /> Létrehozó / Kereskedő (automatikus)
        </Label>
        <div className="h-11 rounded-xl bg-[#FF9500]/8 border border-[#FF9500]/20 px-3 flex items-center text-[0.875rem] text-[#1D1D1F] font-medium">
          {letrehozo || <span className="text-[#86868B]">betöltés…</span>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Vevő megnevezése *</Label>
        <PartnerSelect value={customer} onChange={setCustomer} placeholder="Pl. EVE Debrecen" className={inputClass} />
        <p className="text-[0.6875rem] text-[#86868B]">A partnerek közül választhatsz, vagy új nevet is beírhatsz.</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Projekt megnevezése *</Label>
        <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Pl. Kerítés panel sorozat" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Kérés típusa *</Label>
        <Select value={keresTipus} onValueChange={setKeresTipus}>
          <SelectTrigger className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KERES_TIPUSOK.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Gyártási művelet</Label>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Becsült kg (ha ismert)</Label>
          <Input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Kért határidő</Label>
          <Input type="date" value={kertHatarido} onChange={(e) => setKertHatarido(e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Felelős / Feldolgozó</Label>
          <FelelosSelect value={felelos} onChange={setFelelos} className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]" />
        </div>
      </div>

      <div className="rounded-xl bg-[#FFF7ED] border border-[#FF9500]/25 px-3 py-2.5 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-[#FF9500] shrink-0 mt-0.5" />
        <p className="text-[0.75rem] text-[#1D1D1F] leading-snug">
          Ez a munka még <span className="font-semibold">nincs gyártásra engedélyezve</span>. A gyártási engedély a „Megrendelve — gyártásra kiadás" lépésnél adható meg.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Leírás / megjegyzés</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Munka részletei…" rows={3} className="rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Dokumentumok (rajzok, tervek, fájlok)</Label>
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
      <button onClick={() => setOpen(false)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
      <button onClick={submit} disabled={saving} className="flex-1 h-11 rounded-xl bg-[#FF9500] hover:bg-[#FF9500]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Munkakérés létrehozása"}
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
              <DrawerTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Új munkakérés</DrawerTitle>
            </DrawerHeader>
            {fields}
            {footer}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E5E5EA] shrink-0">
              <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Új munkakérés</DialogTitle>
            </DialogHeader>
            {fields}
            {footer}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}