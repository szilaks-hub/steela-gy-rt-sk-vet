import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, progressFor } from "@/lib/munkalapConfig";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Loader2, X, FileText } from "lucide-react";

export default function MunkalapForm({ onCreated }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [operation, setOperation] = useState(OPERATIONS[0].value);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCustomer("");
    setOperation(OPERATIONS[0].value);
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
    setSaving(true);
    setError("");
    try {
      const docUrls = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        docUrls.push(file_url);
      }
      const existing = await base44.entities.Munkalap.list("-created_date", 500);
      const year = new Date().getFullYear();
      const n = (existing.length || 0) + 1;
      const code = `GY-${year}-${String(n).padStart(3, "0")}`;
      const created = await base44.entities.Munkalap.create({
        code,
        customer_name: customer.trim(),
        operation,
        status: "terv_feldolgozas",
        accepted: false,
        documents: docUrls,
        progress: progressFor("terv_feldolgozas"),
        description: description.trim(),
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
          <DrawerContent className="h-[85vh] flex flex-col gap-0">
            <DrawerHeader className="px-5 pt-3 pb-2 shrink-0">
              <DrawerTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Új munkalap</DrawerTitle>
            </DrawerHeader>
            {fields}
            {footer}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md p-0 gap-0 flex flex-col max-h-[88vh]">
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