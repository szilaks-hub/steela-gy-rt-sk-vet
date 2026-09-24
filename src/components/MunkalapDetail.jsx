import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  operationLabel,
  operationColor,
  stageMeta,
  keresTipusLabel,
  megszakitasOkLabel,
  formatDate,
  deadlineStatus,
  elapsedMs,
  formatDays,
  formatDateTime,
  MEGSZAKITAS_OKOK,
} from "@/lib/munkalapConfig";
import {
  befogadMunkalap,
  feldolgozasKesz,
  vevonekKuldve,
  megrendelEsKiad,
  gyartasIndit,
  gyartasKesz,
  felrakvaLezar,
  megszakitMunkalap,
  surgoKeres,
  surgoValasz,
} from "@/lib/munkalapActions";
import { logAudit } from "@/lib/auditLog";
import CommentSection from "@/components/CommentSection";
import MunkalapEditForm from "@/components/MunkalapEditForm";
import MunkalapTimeline from "@/components/MunkalapTimeline";
import MunkalapMunkasok from "@/components/MunkalapMunkasok";
import MunkalapDocuments from "@/components/MunkalapDocuments";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Flag,
  Clock,
  Scale,
  User,
  CalendarClock,
  Ban,
  Zap,
  ShieldCheck,
  Factory,
  Truck,
  PackageCheck,
  ArrowLeft,
  FileText,
  MessageSquare,
} from "lucide-react";

const SectionLabel = ({ icon: Icon, children }) => (
  <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5 inline-flex items-center gap-1.5">
    <Icon className="w-3.5 h-3.5" />
    {children}
  </p>
);

export default function MunkalapDetail({ munkalap, onClose, onUpdated }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [munkasList, setMunkasList] = useState([]);
  const [dialog, setDialog] = useState(null); // "megrendel" | "gyartasIndit" | "gyartasKesz" | "felrak" | "megszakit" | "surgoKeres" | "surgoValasz"
  const [form, setForm] = useState({});

  useEffect(() => {
    base44.entities.Munkas.list("-created_date", 500).then(setMunkasList).catch(() => {});
  }, []);

  const m = munkalap;
  const stage = stageMeta(m.status);
  const StageIcon = stage.icon;
  const opColor = operationColor(m.operation);
  const totalMs = elapsedMs(m);
  const kg = Number(m.quantity_kg);
  const dl = deadlineStatus(m.kert_hatarido);
  const isMegszakitva = m.status === "megszakitva";
  const isLezarva = m.status === "lezarva";
  const isTerminal = isMegszakitva || isLezarva;
  const notAuthorized = ["munkakeres", "feldolgozas_alatt", "elkeszitve", "vevoi_dontes"].includes(m.status);
  const authorized = ["gyartasra_kiadva", "gyartasban", "rakodhato", "lezarva"].includes(m.status);

  const openDialog = (type) => {
    setForm({
      quantity_kg: m.quantity_kg || "",
      gyartasi_datum: m.gyartasi_datum || "",
      kiszallitasi_datum: m.kiszallitasi_datum || "",
      gyartas_felelos: m.gyartas_felelos || m.felelos || "",
      tervezett_befejezes: m.tervezett_befejezes || "",
      varhato_rakodhato: m.varhato_rakodhato || "",
      elkeszult_mennyiseg: m.elkeszult_mennyiseg || m.quantity_kg || "",
      rakodhato_mennyiseg: m.rakodhato_mennyiseg || m.quantity_kg || "",
      rakodasi_hely: m.rakodasi_hely || "",
      rakodott_kg: m.rakodott_kg || m.quantity_kg || "",
      rendszam: m.rendszam || "",
      fuvar_azonosito: m.fuvar_azonosito || "",
      megszakitva_ok: MEGSZAKITAS_OKOK[0].value,
      surgo_datum: "",
      surgo_indok: "",
      surgo_valasz_datum: "",
      surgo_valasz_mennyiseg: "",
      surgo_valasz_note: "",
    });
    setDialog(type);
  };

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      const updated = await fn();
      if (msg) toast({ title: msg });
      onUpdated(updated);
      setDialog(null);
    } catch (e) {
      toast({ title: "Hiba", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const befogad = () => run(() => befogadMunkalap(m), "Befogadva — feldolgozás alatt");
  const feldolgozasKeszFn = () => run(() => feldolgozasKesz(m), "Feldolgozás kész");
  const vevonekKuldveFn = () => run(() => vevonekKuldve(m), "Vevőnek továbbítva");
  const megrendelFn = () => run(() => megrendelEsKiad(m, {
    quantity_kg: Number(form.quantity_kg) || 0,
    gyartasi_datum: form.gyartasi_datum || null,
    kiszallitasi_datum: form.kiszallitasi_datum || null,
  }), "Megrendelve — GYÁRTÁS ENGEDÉLYEZVE");
  const gyartasInditFn = () => run(() => gyartasIndit(m, {
    gyartas_felelos: form.gyartas_felelos || "",
    tervezett_befejezes: form.tervezett_befejezes || null,
    varhato_rakodhato: form.varhato_rakodhato || null,
  }), "Gyártás elindítva");
  const gyartasKeszFn = () => run(() => gyartasKesz(m, {
    elkeszult_mennyiseg: Number(form.elkeszult_mennyiseg) || 0,
    rakodhato_mennyiseg: Number(form.rakodhato_mennyiseg) || 0,
    rakodasi_hely: form.rakodasi_hely || "",
  }), "Gyártás kész — rakodható");
  const felrakFn = () => run(() => felrakvaLezar(m, {
    rakodott_kg: Number(form.rakodott_kg) || 0,
    rendszam: form.rendszam || "",
    fuvar_azonosito: form.fuvar_azonosito || "",
  }), "Felrakva — munka lezárva");
  const megszakitFn = () => run(() => megszakitMunkalap(m, form.megszakitva_ok), "Munka megszakítva");
  const surgoKeresFn = () => run(() => surgoKeres(m, form.surgo_datum, form.surgo_indok), "Sürgősségi kérés elküldve a gyárnak");
  const surgoValaszFn = (allapot) => run(() => surgoValasz(m, allapot, {
    surgo_valasz_datum: form.surgo_valasz_datum || null,
    surgo_valasz_mennyiseg: Number(form.surgo_valasz_mennyiseg) || 0,
    surgo_valasz_note: form.surgo_valasz_note || "",
  }), "Sürgősségi válasz rögzítve");

  const archive = async () => {
    setBusy(true);
    try {
      await base44.entities.Munkalap.update(m.id, { archived: !m.archived });
      logAudit({ action: m.archived ? "restore" : "archive", munkalap_id: m.id, munkalap_code: m.code });
      toast({ title: m.archived ? "Visszaállítva" : "Archiválva" });
      onUpdated(null);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    setBusy(true);
    try {
      await base44.entities.Munkalap.delete(m.id);
      logAudit({ action: "delete", munkalap_id: m.id, munkalap_code: m.code });
      toast({ title: "Munkalap törölve" });
      onUpdated(null);
    } finally {
      setBusy(false);
    }
  };

  const toggleFlag = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.Munkalap.update(m.id, { flagged: !m.flagged });
      logAudit({ action: m.flagged ? "unflag" : "flag", munkalap_id: m.id, munkalap_code: m.code });
      toast({ title: m.flagged ? "Jelölés eltávolítva" : "Kiemeltre jelölve" });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-0.5">
      <button onClick={toggleFlag} disabled={busy} className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors ${m.flagged ? "text-red-500 bg-red-500/10" : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"}`} title={m.flagged ? "Jelölés eltávolítása" : "Kiemeltre jelölés"}>
        <Flag className="w-4 h-4" />
      </button>
      <button onClick={() => setEditing(true)} disabled={busy} className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] flex items-center justify-center disabled:opacity-50 transition-colors" title="Szerkesztés">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={archive} disabled={busy} className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] flex items-center justify-center disabled:opacity-50 transition-colors" title={m.archived ? "Visszaállítás" : "Archiválás"}>
        {m.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
      </button>
      <button onClick={del} disabled={busy} className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center disabled:opacity-50 transition-colors" title="Törlés">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const infoRows = [
    { label: "Vevő", value: m.customer_name },
    { label: "Projekt", value: m.project_name },
    { label: "Kereskedő", value: m.kereskedo || m.letrehozo_nev },
    { label: "Kérés típusa", value: keresTipusLabel(m.keres_tipus) },
    { label: "Művelet", value: operationLabel(m.operation) },
    { label: "Felelős / Feldolgozó", value: m.felelos },
    { label: "Befogadta", value: m.befogado_nev },
    { label: "Létrehozás", value: formatDateTime(m.created_date) },
  ].filter((r) => r.value);

  const inputClass = "h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]";

  const dialogContent = () => {
    if (dialog === "megrendel") return (
      <>
        <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Megrendelve — gyártásra kiadás</DialogTitle>
        <p className="text-[0.75rem] text-[#86868B] -mt-1">Ezzel adod ki a gyártási engedélyt.</p>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Gyártandó mennyiség (kg) *</Label><Input type="number" value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Kért elkészülés</Label><Input type="date" value={form.gyartasi_datum} onChange={(e) => setForm({ ...form, gyartasi_datum: e.target.value })} className={inputClass} /></div>
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Kért rakodás</Label><Input type="date" value={form.kiszallitasi_datum} onChange={(e) => setForm({ ...form, kiszallitasi_datum: e.target.value })} className={inputClass} /></div>
          </div>
        </div>
        <DialogFooter className="pt-3 gap-2.5">
          <button onClick={() => setDialog(null)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
          <button onClick={megrendelFn} disabled={busy} className="flex-1 h-11 rounded-xl bg-[#FF6B35] text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Gyártásra kiadás</button>
        </DialogFooter>
      </>
    );
    if (dialog === "gyartasIndit") return (
      <>
        <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Gyártás indítása</DialogTitle>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Gyártás felelős</Label><Input value={form.gyartas_felelos} onChange={(e) => setForm({ ...form, gyartas_felelos: e.target.value })} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Tervezett befejezés</Label><Input type="date" value={form.tervezett_befejezes} onChange={(e) => setForm({ ...form, tervezett_befejezes: e.target.value })} className={inputClass} /></div>
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Várható rakodhatóság</Label><Input type="date" value={form.varhato_rakodhato} onChange={(e) => setForm({ ...form, varhato_rakodhato: e.target.value })} className={inputClass} /></div>
          </div>
        </div>
        <DialogFooter className="pt-3 gap-2.5">
          <button onClick={() => setDialog(null)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
          <button onClick={gyartasInditFn} disabled={busy} className="flex-1 h-11 rounded-xl bg-[#0A84FF] text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Factory className="w-4 h-4" />} Gyártás indítása</button>
        </DialogFooter>
      </>
    );
    if (dialog === "gyartasKesz") return (
      <>
        <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Gyártás kész — rakodható</DialogTitle>
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Elkészült (kg)</Label><Input type="number" value={form.elkeszult_mennyiseg} onChange={(e) => setForm({ ...form, elkeszult_mennyiseg: e.target.value })} className={inputClass} /></div>
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Rakodható (kg)</Label><Input type="number" value={form.rakodhato_mennyiseg} onChange={(e) => setForm({ ...form, rakodhato_mennyiseg: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Rakodási hely</Label><Input value={form.rakodasi_hely} onChange={(e) => setForm({ ...form, rakodasi_hely: e.target.value })} className={inputClass} /></div>
        </div>
        <DialogFooter className="pt-3 gap-2.5">
          <button onClick={() => setDialog(null)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
          <button onClick={gyartasKeszFn} disabled={busy} className="flex-1 h-11 rounded-xl bg-[#34C759] text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />} Gyártás kész</button>
        </DialogFooter>
      </>
    );
    if (dialog === "felrak") return (
      <>
        <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Felrakva — lezárás</DialogTitle>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Tényleges rakodott kg</Label><Input type="number" value={form.rakodott_kg} onChange={(e) => setForm({ ...form, rakodott_kg: e.target.value })} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Rendszám</Label><Input value={form.rendszam} onChange={(e) => setForm({ ...form, rendszam: e.target.value })} className={inputClass} /></div>
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Fuvar azonosító</Label><Input value={form.fuvar_azonosito} onChange={(e) => setForm({ ...form, fuvar_azonosito: e.target.value })} className={inputClass} /></div>
          </div>
        </div>
        <DialogFooter className="pt-3 gap-2.5">
          <button onClick={() => setDialog(null)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
          <button onClick={felrakFn} disabled={busy} className="flex-1 h-11 rounded-xl bg-[#8E8E93] text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />} Felrakva — lezárás</button>
        </DialogFooter>
      </>
    );
    if (dialog === "megszakit") return (
      <>
        <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Munka megszakítása</DialogTitle>
        <p className="text-[0.75rem] text-[#86868B] -mt-1">Az adatokat nem töröljük — a megszakítás oka KPI alap lesz.</p>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Megszakítás oka *</Label>
            <select value={form.megszakitva_ok} onChange={(e) => setForm({ ...form, megszakitva_ok: e.target.value })} className="w-full h-11 rounded-xl bg-[#F5F5F7] px-3 text-[0.875rem]">
              {MEGSZAKITAS_OKOK.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter className="pt-3 gap-2.5">
          <button onClick={() => setDialog(null)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
          <button onClick={megszakitFn} disabled={busy} className="flex-1 h-11 rounded-xl bg-[#FF6961] text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Megszakítás</button>
        </DialogFooter>
      </>
    );
    if (dialog === "surgoKeres") return (
      <>
        <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Korábbi időpont kérése</DialogTitle>
        <div className="space-y-3 pt-2">
          <div className="rounded-lg bg-[#F5F5F7] px-3 py-2 text-[0.8125rem] text-[#86868B]">Jelenlegi várható rakodhatóság: <span className="font-semibold text-[#1D1D1F]">{formatDate(m.varhato_rakodhato) || "—"}</span></div>
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Kért új időpont *</Label><Input type="date" value={form.surgo_datum} onChange={(e) => setForm({ ...form, surgo_datum: e.target.value })} className={inputClass} /></div>
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Indok (opcionális)</Label><Textarea value={form.surgo_indok} onChange={(e) => setForm({ ...form, surgo_indok: e.target.value })} rows={2} className="rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]" /></div>
        </div>
        <DialogFooter className="pt-3 gap-2.5">
          <button onClick={() => setDialog(null)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">Mégse</button>
          <button onClick={surgoKeresFn} disabled={busy} className="flex-1 h-11 rounded-xl bg-[#FFCC00] text-[#1D1D1F] text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Kérés küldése a gyárnak</button>
        </DialogFooter>
      </>
    );
    if (dialog === "surgoValasz") return (
      <>
        <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">Sürgősségi kérés válasza</DialogTitle>
        <div className="space-y-3 pt-2">
          <div className="rounded-lg bg-[#FFCC00]/15 px-3 py-2 text-[0.8125rem]">Kért időpont: <span className="font-semibold">{formatDate(m.surgo_keres_datum)}</span>{m.surgo_keres_indok ? ` — ${m.surgo_keres_indok}` : ""}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Vállalt időpont</Label><Input type="date" value={form.surgo_valasz_datum} onChange={(e) => setForm({ ...form, surgo_valasz_datum: e.target.value })} className={inputClass} /></div>
            <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Részbenes mennyiség (kg)</Label><Input type="number" value={form.surgo_valasz_mennyiseg} onChange={(e) => setForm({ ...form, surgo_valasz_mennyiseg: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-[0.8125rem] font-medium">Válasz megjegyzés</Label><Textarea value={form.surgo_valasz_note} onChange={(e) => setForm({ ...form, surgo_valasz_note: e.target.value })} rows={2} className="rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3">
          <button onClick={() => surgoValaszFn("elfogadva")} disabled={busy} className="h-11 rounded-xl bg-[#34C759] text-white text-[0.8125rem] font-medium disabled:opacity-60">Elfogadva</button>
          <button onClick={() => surgoValaszFn("reszben")} disabled={busy} className="h-11 rounded-xl bg-[#FF9500] text-white text-[0.8125rem] font-medium disabled:opacity-60">Részben</button>
          <button onClick={() => surgoValaszFn("nem_teljesitheto")} disabled={busy} className="h-11 rounded-xl bg-[#FF6961] text-white text-[0.8125rem] font-medium disabled:opacity-60">Nem teljesíthető</button>
        </div>
      </>
    );
    return null;
  };

  const footerButton = () => {
    if (isTerminal) return null;
    switch (m.status) {
      case "munkakeres": return { label: "Befogadom", icon: CheckCircle2, color: "#FF9500", fn: befogad };
      case "feldolgozas_alatt": return { label: "Feldolgozás kész", icon: CheckCircle2, color: "#5AC8FA", fn: feldolgozasKeszFn };
      case "elkeszitve": return { label: "Vevőnek küldve", icon: MessageSquare, color: "#AF52DE", fn: vevonekKuldveFn };
      case "vevoi_dontes": return { label: "Megrendelve — gyártásra kiadás", icon: ShieldCheck, color: "#FF6B35", fn: () => openDialog("megrendel") };
      case "gyartasra_kiadva": return { label: "Gyártás indítása", icon: Factory, color: "#0A84FF", fn: () => openDialog("gyartasIndit") };
      case "gyartasban": return { label: "Gyártás kész", icon: Truck, color: "#34C759", fn: () => openDialog("gyartasKesz") };
      case "rakodhato": return { label: "Felrakva — lezárás", icon: PackageCheck, color: "#8E8E93", fn: () => openDialog("felrak") };
      default: return null;
    }
  };
  const fb = footerButton();

  const body = (
    <div className="flex-1 overflow-y-auto bg-white px-5 py-4 space-y-5">
      {notAuthorized && (
        <div className="rounded-2xl bg-[#FFF7ED] border border-[#FF9500]/25 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#FF9500] shrink-0 mt-0.5" />
          <p className="text-[0.8125rem] text-[#1D1D1F]">Ez a munka még <span className="font-semibold">nincs gyártásra engedélyezve</span>.</p>
        </div>
      )}
      {authorized && !isTerminal && (
        <div className="rounded-2xl bg-[#34C759]/10 border border-[#34C759]/30 px-4 py-3 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0 mt-0.5" />
          <p className="text-[0.8125rem] text-[#1D1D1F]"><span className="font-semibold text-[#34C759]">GYÁRTÁS ENGEDÉLYEZVE</span> — {m.gyartasra_kiadta ? `kiadta: ${m.gyartasra_kiadta}` : ""}</p>
        </div>
      )}
      {isMegszakitva && (
        <div className="rounded-2xl bg-[#FF6961]/10 border border-[#FF6961]/30 px-4 py-3 flex items-start gap-2.5">
          <Ban className="w-4 h-4 text-[#FF6961] shrink-0 mt-0.5" />
          <p className="text-[0.8125rem] text-[#1D1D1F]"><span className="font-semibold text-[#FF6961]">MEGSZAKÍTVA</span> — {megszakitasOkLabel(m.megszakitva_ok)} ({formatDateTime(m.megszakitva_at) || "—"})</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { Icon: Clock, label: "Eltelt idő", value: formatDays(totalMs), accent: "#FF9500" },
          { Icon: Scale, label: "Mennyiség", value: kg > 0 ? `${kg.toLocaleString("hu-HU")} kg` : "—", accent: opColor },
          { Icon: User, label: "Felelős", value: m.felelos || "—", accent: "#5B9BD5" },
          { Icon: CalendarClock, label: "Kért határidő", value: m.kert_hatarido ? formatDate(m.kert_hatarido) : "—", hint: dl?.label, hintColor: dl?.color, accent: dl?.color || "#86868B" },
        ].map((mt) => (
          <div key={mt.label} className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: mt.accent + "1A", color: mt.accent }}><mt.Icon className="w-3.5 h-3.5" /></span>
            <p className="text-[0.6875rem] text-[#86868B]">{mt.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[0.875rem] font-semibold text-[#1D1D1F] truncate">{mt.value}</p>
              {mt.hint && <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: mt.hintColor + "1A", color: mt.hintColor }}>{mt.hint}</span>}
            </div>
          </div>
        ))}
      </div>

      <div>
        <SectionLabel icon={FileText}>Adatok</SectionLabel>
        <div className="rounded-2xl border border-[#EDEDF0] divide-y divide-[#F2F2F5] overflow-hidden">
          {infoRows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
              <span className="text-[0.8125rem] text-[#86868B]">{r.label}</span>
              <span className="text-[0.8125rem] font-medium text-[#1D1D1F] text-right max-w-[60%] truncate">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {authorized && (
        <div>
          <SectionLabel icon={Factory}>Gyártási adatok</SectionLabel>
          <div className="rounded-2xl border border-[#EDEDF0] divide-y divide-[#F2F2F5] overflow-hidden">
            {[
              { label: "Gyártandó mennyiség", value: m.quantity_kg ? `${Number(m.quantity_kg).toLocaleString("hu-HU")} kg` : "" },
              { label: "Kért elkészülés", value: m.gyartasi_datum ? formatDate(m.gyartasi_datum) : "" },
              { label: "Kért rakodás", value: m.kiszallitasi_datum ? formatDate(m.kiszallitasi_datum) : "" },
              { label: "Gyártás felelős", value: m.gyartas_felelos },
              { label: "Tervezett befejezés", value: m.tervezett_befejezes ? formatDate(m.tervezett_befejezes) : "" },
              { label: "Várható rakodhatóság", value: m.varhato_rakodhato ? formatDate(m.varhato_rakodhato) : "" },
              { label: "Gyártás kezdete", value: formatDateTime(m.gyartas_kezdete) },
              { label: "Gyártás vége", value: formatDateTime(m.gyartas_vege) },
            ].filter((r) => r.value).map((r, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[0.8125rem] text-[#86868B]">{r.label}</span>
                <span className="text-[0.8125rem] font-medium text-[#1D1D1F]">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(m.status === "rakodhato" || isLezarva) && (
        <div>
          <SectionLabel icon={Truck}>Rakodás</SectionLabel>
          <div className="rounded-2xl border border-[#EDEDF0] divide-y divide-[#F2F2F5] overflow-hidden">
            {[
              { label: "Elkészült mennyiség", value: m.elkeszult_mennyiseg ? `${Number(m.elkeszult_mennyiseg).toLocaleString("hu-HU")} kg` : "" },
              { label: "Rakodható mennyiség", value: m.rakodhato_mennyiseg ? `${Number(m.rakodhato_mennyiseg).toLocaleString("hu-HU")} kg` : "" },
              { label: "Rakodási hely", value: m.rakodasi_hely },
              { label: "Rakodható időpontja", value: formatDateTime(m.rakodhato_at) },
              { label: "Rakodott kg", value: m.rakodott_kg ? `${Number(m.rakodott_kg).toLocaleString("hu-HU")} kg` : "" },
              { label: "Rendszám", value: m.rendszam },
              { label: "Fuvar azonosító", value: m.fuvar_azonosito },
              { label: "Felrakva", value: formatDateTime(m.felrakva_at) },
            ].filter((r) => r.value).map((r, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[0.8125rem] text-[#86868B]">{r.label}</span>
                <span className="text-[0.8125rem] font-medium text-[#1D1D1F]">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sürgősségi szakasz */}
      {m.status === "gyartasban" && (
        <div className="rounded-2xl border border-[#FFCC00]/40 bg-[#FFFBEB] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#FF9500]" /> Sürgősség</span>
            <span className="text-[0.75rem] text-[#86868B]">Várható rakodhatóság: <span className="font-semibold text-[#1D1D1F]">{formatDate(m.varhato_rakodhato) || "—"}</span></span>
          </div>
          {m.surgo_allapot === "pending" ? (
            <div className="space-y-2">
              <p className="text-[0.75rem] text-[#1D1D1F]">Kért korábbi időpont: <span className="font-semibold">{formatDate(m.surgo_keres_datum)}</span>{m.surgo_keres_indok ? ` — ${m.surgo_keres_indok}` : ""}</p>
              <button onClick={() => openDialog("surgoValasz")} className="w-full h-10 rounded-xl bg-[#FF9500] text-white text-[0.8125rem] font-medium inline-flex items-center justify-center gap-1.5"><Zap className="w-4 h-4" /> Válasz a kérésre (gyár)</button>
            </div>
          ) : m.surgo_allapot && m.surgo_allapot !== "pending" ? (
            <p className="text-[0.75rem] text-[#1D1D1F]">Válasz: <span className="font-semibold">{({ elfogadva: "Elfogadva", reszben: "Részben teljesíthető", nem_teljesitheto: "Nem teljesíthető" })[m.surgo_allapot]}</span>{m.surgo_valasz_datum ? ` — ${formatDate(m.surgo_valasz_datum)}` : ""}{m.surgo_valasz_note ? ` · ${m.surgo_valasz_note}` : ""}</p>
          ) : (
            <button onClick={() => openDialog("surgoKeres")} className="w-full h-10 rounded-xl border border-[#FFCC00] text-[#9a7b00] text-[0.8125rem] font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#FFCC00]/10"><Zap className="w-4 h-4" /> Korábbi időpont kérése</button>
          )}
        </div>
      )}

      {!isTerminal && <MunkalapMunkasok munkalap={m} munkasList={munkasList} onUpdated={onUpdated} />}
      <MunkalapDocuments munkalap={m} onUpdated={onUpdated} />

      {m.description && (
        <div>
          <SectionLabel icon={FileText}>Leírás</SectionLabel>
          <p className="text-[0.875rem] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap rounded-2xl bg-[#FBFBFD] border border-[#EDEDF0] p-3.5">{m.description}</p>
        </div>
      )}

      <div>
        <SectionLabel icon={Clock}>Munkalap idővonal</SectionLabel>
        <MunkalapTimeline munkalap={m} />
      </div>

      <div className="pt-1">
        <SectionLabel icon={MessageSquare}>Megjegyzések</SectionLabel>
        <CommentSection munkalapId={m.id} />
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-[#EDEDF0] px-5 py-3.5 bg-white space-y-2">
      {isTerminal ? (
        <div className="text-center text-[0.875rem] font-medium py-2.5 inline-flex items-center justify-center gap-1.5 w-full" style={{ color: isMegszakitva ? "#FF6961" : "#8E8E93" }}>
          {isMegszakitva ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {isMegszakitva ? "Munka megszakítva" : "Munka lezárva"} — csak olvasható
        </div>
      ) : (
        <div className="flex gap-2.5">
          {fb && (
            <button onClick={fb.fn} disabled={busy} className="flex-1 h-11 rounded-full text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ backgroundColor: fb.color }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <fb.icon className="w-4 h-4" />} {fb.label}
            </button>
          )}
          <button onClick={() => openDialog("megszakit")} disabled={busy} className="h-11 px-4 rounded-full border border-[#FF6961]/40 text-[#FF6961] text-[0.8125rem] font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#FF6961]/10 disabled:opacity-50">
            <Ban className="w-4 h-4" /> Megszakítás
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
        <div className="relative w-full max-w-2xl max-h-[88vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="border-b border-[#EDEDF0] shrink-0">
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${opColor}, ${stage.color})` }} />
          <div className="px-5 pt-3 pb-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={onClose} className="shrink-0 w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-[#1D1D1F] transition-colors" title="Bezárás"><ArrowLeft className="w-5 h-5" /></button>
                <div className="min-w-0">
                  <h2 className="text-[1rem] font-semibold text-[#1D1D1F] font-mono leading-tight truncate">{m.code}</h2>
                  <p className="text-[0.875rem] text-[#1D1D1F] font-medium truncate">{m.customer_name}</p>
                </div>
              </div>
              {headerActions}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold" style={{ backgroundColor: stage.color + "1A", color: stage.color }}><StageIcon className="w-3.5 h-3.5" /> {stage.label}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold" style={{ backgroundColor: opColor + "1A", color: opColor }}>{operationLabel(m.operation)}</span>
              {m.flagged && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold bg-red-500/10 text-red-500"><Flag className="w-3.5 h-3.5" /> Kiemelt</span>}
              {m.archived && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold bg-[#86868B]/10 text-[#86868B]"><Archive className="w-3.5 h-3.5" /> Archivált</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          {body}
          {footer}
        </div>
        </div>
      </div>
      {dialog && (
        <Dialog open onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent className="sm:max-w-md p-5 gap-0">{dialogContent()}</DialogContent>
        </Dialog>
      )}
      {editing && (
        <MunkalapEditForm munkalap={m} onSaved={(updated) => { setEditing(false); onUpdated(updated); }} onClose={() => setEditing(false)} />
      )}
    </>
  );
}