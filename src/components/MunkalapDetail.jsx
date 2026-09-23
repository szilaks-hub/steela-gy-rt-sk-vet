import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  operationLabel,
  operationColor,
  stageMeta,
  NEXT_STATUS,
  formatDate,
  deadlineStatus,
  elapsedMs,
  formatDays,
  formatDateTime,
} from "@/lib/munkalapConfig";
import { advanceMunkalap, acceptMunkalap } from "@/lib/munkalapActions";
import CommentSection from "@/components/CommentSection";
import MunkalapEditForm from "@/components/MunkalapEditForm";
import MunkalapFlow from "@/components/MunkalapFlow";
import MunkalapStats from "@/components/MunkalapStats";
import MunkalapMunkasok from "@/components/MunkalapMunkasok";
import MunkalapDocuments from "@/components/MunkalapDocuments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Check,
  Loader2,
  Calendar,
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
  Bell,
  X,
  SearchCheck,
  ArrowLeft,
} from "lucide-react";

export default function MunkalapDetail({ munkalap, onClose, onUpdated }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [munkasList, setMunkasList] = useState([]);
  useEffect(() => {
    base44.entities.Munkas.list("-created_date", 500).then(setMunkasList).catch(() => {});
  }, []);
  const m = munkalap;
  const stage = stageMeta(m.status);
  const StageIcon = stage.icon;
  const opColor = operationColor(m.operation);
  const next = NEXT_STATUS[m.status];
  const canAdvance = next && !(m.status === "elfogadasra_var" && !m.accepted) && !m.archived;
  const kg = Number(m.quantity_kg);
  const dl = deadlineStatus(m.terv_hatarido);
  const totalMs = elapsedMs(m);
  const history = Array.isArray(m.stage_history) ? m.stage_history : [];
  const changes = [...history].reverse();
  const lastChange = changes[0];

  const accept = async () => {
    setBusy(true);
    try {
      const updated = await acceptMunkalap(m);
      toast({ title: "Munkalap elfogadva" });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    if (!canAdvance) return;
    setBusy(true);
    try {
      const updated = await advanceMunkalap(m, next);
      toast({ title: "Áthelyezve: " + stageMeta(next).label });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    setBusy(true);
    try {
      await base44.entities.Munkalap.update(m.id, { archived: !m.archived });
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
      toast({ title: m.flagged ? "Jelölés eltávolítva" : "Kiemeltre jelölve" });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-0.5">
      <button
        onClick={toggleFlag}
        disabled={busy}
        className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors ${
          m.flagged ? "text-red-500 bg-red-500/10" : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
        }`}
        title={m.flagged ? "Jelölés eltávolítása" : "Kiemeltre jelölés"}
      >
        <Flag className="w-4 h-4" />
      </button>
      <button
        onClick={() => setEditing(true)}
        disabled={busy}
        className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] flex items-center justify-center disabled:opacity-50 transition-colors"
        title="Szerkesztés"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={archive}
        disabled={busy}
        className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] flex items-center justify-center disabled:opacity-50 transition-colors"
        title={m.archived ? "Visszaállítás" : "Archiválás"}
      >
        {m.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={busy}
            className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center disabled:opacity-50 transition-colors"
            title="Törlés"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Munkalap törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törlöd a(z) {m.code} munkalapot? Ez a művelet nem visszavonható.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={del} className="bg-red-500 hover:bg-red-500/90 text-white">
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );

  const metrics = [
    { Icon: Clock, label: "Gyártási idő", value: formatDays(totalMs), accent: "#FF9500" },
    { Icon: Scale, label: "Mennyiség", value: kg > 0 ? `${kg.toLocaleString("hu-HU")} kg` : "—", accent: opColor },
    { Icon: User, label: "Felelős", value: m.felelos || "—", accent: "#5B9BD5" },
    {
      Icon: CalendarClock,
      label: "Határidő",
      value: m.terv_hatarido ? formatDate(m.terv_hatarido) : "—",
      hint: dl?.label,
      hintColor: dl?.color,
      accent: dl?.color || "#86868B",
    },
  ];

  const SectionLabel = ({ icon: Icon, children }) => (
    <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-2.5 inline-flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {children}
    </p>
  );

  const body = (
    <div className="flex-1 overflow-y-auto bg-white px-5 py-4 space-y-5">
      {/* Metric chips */}
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((mt) => (
          <div key={mt.label} className="rounded-2xl border border-[#EDEDF0] bg-[#FBFBFD] p-3">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: mt.accent + "1A", color: mt.accent }}
            >
              <mt.Icon className="w-3.5 h-3.5" />
            </span>
            <p className="text-[0.6875rem] text-[#86868B]">{mt.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[0.875rem] font-semibold text-[#1D1D1F] truncate">{mt.value}</p>
              {mt.hint && (
                <span
                  className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: mt.hintColor + "1A", color: mt.hintColor }}
                >
                  {mt.hint}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <MunkalapMunkasok munkalap={m} munkasList={munkasList} onUpdated={onUpdated} />

      {/* Checking button */}
      <button
        onClick={() => setChecking((v) => !v)}
        className={`w-full h-11 rounded-2xl text-[0.8125rem] font-medium inline-flex items-center justify-center gap-2 transition-all ${
          checking
            ? "bg-[#FF9500] text-white border border-[#FF9500]"
            : "border border-[#E5E5EA] text-[#1D1D1F] hover:border-[#FF9500]/50 hover:bg-[#FFF7ED]"
        }`}
      >
        <SearchCheck className="w-4 h-4" style={{ color: checking ? "#fff" : "#FF9500" }} />
        {checking ? "Checking elrejtése" : "Checking – hogy áll a gyártás?"}
      </button>

      {checking && (
        <div className="rounded-2xl border border-[#FF9500]/30 bg-gradient-to-br from-[#FFF7ED] to-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5">
              <SearchCheck className="w-4 h-4 text-[#FF9500]" /> Státusz checking
            </span>
            <button onClick={() => setChecking(false)} className="text-[#86868B] hover:text-[#1D1D1F]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-[0.8125rem]">
            <div className="flex items-center justify-between">
              <span className="text-[#86868B]">Jelenlegi fázis</span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold"
                style={{ backgroundColor: stage.color + "1A", color: stage.color }}
              >
                <StageIcon className="w-3.5 h-3.5" />
                {stage.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#86868B]">Gyártási idő</span>
              <span className="font-semibold text-[#1D1D1F]">{formatDays(totalMs)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#86868B]">Előrehaladás</span>
              <span className="font-semibold text-[#1D1D1F]">{m.progress || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#86868B]">Határidő</span>
              <span className="font-semibold text-[#1D1D1F]">
                {m.terv_hatarido ? formatDate(m.terv_hatarido) : "—"}
                {dl && (
                  <span className="ml-1.5 text-[0.6875rem]" style={{ color: dl.color }}>
                    ({dl.label})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#86868B]">Felelős</span>
              <span className="font-semibold text-[#1D1D1F]">{m.felelos || "—"}</span>
            </div>
            {lastChange && (
              <div className="flex items-center justify-between">
                <span className="text-[#86868B]">Utolsó változás</span>
                <span className="font-semibold text-[#1D1D1F]">{formatDateTime(lastChange.at) || "—"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <MunkalapStats munkalap={m} />
      <MunkalapFlow munkalap={m} />

      {(m.terv_hatarido || m.gyartasi_datum || m.kiszallitasi_datum) && (
        <div>
          <SectionLabel icon={Calendar}>Dátumok</SectionLabel>
          <div className="rounded-2xl border border-[#EDEDF0] divide-y divide-[#F2F2F5] overflow-hidden">
            {m.terv_hatarido && (
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[0.8125rem] text-[#1D1D1F]">Terv határidő (vevő)</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[0.8125rem] font-medium text-[#1D1D1F]">{formatDate(m.terv_hatarido)}</span>
                  {dl && (
                    <span
                      className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={{ backgroundColor: dl.color + "1A", color: dl.color }}
                    >
                      {dl.diff < 0 && <AlertTriangle className="w-3 h-3" />}
                      {dl.label}
                    </span>
                  )}
                </span>
              </div>
            )}
            {m.gyartasi_datum && (
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[0.8125rem] text-[#1D1D1F]">Gyártási nap</span>
                <span className="text-[0.8125rem] font-medium text-[#1D1D1F]">{formatDate(m.gyartasi_datum)}</span>
              </div>
            )}
            {m.kiszallitasi_datum && (
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[0.8125rem] text-[#1D1D1F]">Kiszállítás</span>
                <span className="text-[0.8125rem] font-medium text-[#1D1D1F]">{formatDate(m.kiszallitasi_datum)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {m.felelos && m.status === "terv_feldolgozas" && !m.archived && dl && dl.diff <= 3 && (
        <div className="rounded-2xl p-3 flex items-start gap-2" style={{ backgroundColor: dl.color + "14" }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: dl.color }} />
          <p className="text-[0.8125rem]" style={{ color: dl.color }}>
            {dl.diff < 0
              ? `A terv feldolgozás határideje lejárt! (${m.felelos})`
              : `${m.felelos}: a terv feldolgozást ${dl.label} múlva le kell adni.`}
          </p>
        </div>
      )}

      <div>
        <div className="flex justify-between text-[0.75rem] text-[#86868B] mb-1.5">
          <span>Előrehaladás</span>
          <span className="font-semibold text-[#1D1D1F]">{m.progress || 0}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#EDEDF0] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF9500] to-[#FFCC00] transition-all"
            style={{ width: `${m.progress || 0}%` }}
          />
        </div>
      </div>

      {m.description && (
        <div>
          <SectionLabel icon={FileText}>Leírás</SectionLabel>
          <p className="text-[0.875rem] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap rounded-2xl bg-[#FBFBFD] border border-[#EDEDF0] p-3.5">
            {m.description}
          </p>
        </div>
      )}

      <MunkalapDocuments munkalap={m} onUpdated={onUpdated} />

      <div>
        <SectionLabel icon={Bell}>Változások</SectionLabel>
        {changes.length === 0 ? (
          <p className="text-[0.8125rem] text-[#86868B] italic">Még nincs változás</p>
        ) : (
          <div className="space-y-2.5">
            {changes.slice(0, 8).map((c, i) => {
              const sm = stageMeta(c.stage);
              const Icon = sm.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: sm.color + "1A", color: sm.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[0.8125rem] text-[#1D1D1F]">
                      <span className="font-semibold">{sm.label}</span>
                      {c.note ? ` — ${c.note}` : ""}
                    </p>
                    <p className="text-[0.6875rem] text-[#86868B] mt-0.5">{formatDateTime(c.at) || "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-1">
        <SectionLabel icon={CheckCircle2}>Megjegyzések</SectionLabel>
        <CommentSection munkalapId={m.id} />
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-[#EDEDF0] px-5 py-3.5 bg-white space-y-2">
      {m.archived ? (
        <button
          onClick={archive}
          disabled={busy}
          className="w-full h-11 rounded-full bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
          Visszaállítás aktívba
        </button>
      ) : (
        <>
          {m.status === "elfogadasra_var" && !m.accepted && (
            <p className="text-[0.75rem] text-[#9a7b00] text-center">Először el kell fogadni a munkalapot a gyártáshoz.</p>
          )}
          <div className="flex gap-2.5">
            {m.status === "elfogadasra_var" && !m.accepted && (
              <button
                onClick={accept}
                disabled={busy}
                className="flex-1 h-11 rounded-full bg-[#34C759] hover:bg-[#34C759]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Elfogadás
              </button>
            )}
            {next && (
              <button
                onClick={advance}
                disabled={busy || !canAdvance}
                className="flex-1 h-11 rounded-full bg-[#FF9500] hover:bg-[#FF9500]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {stageMeta(next).short} fázisba
              </button>
            )}
            {!next && (
              <div className="flex-1 text-center text-[0.875rem] text-[#34C759] font-medium py-2.5 inline-flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Gyártás befejezve
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      {body}
      {footer}
    </div>
  );

  const hero = (
    <div>
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${opColor}, ${stage.color})` }} />
      <div className="px-5 pt-3 pb-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="shrink-0 w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-[#1D1D1F] transition-colors"
              title="Vissza"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[1rem] font-semibold text-[#1D1D1F] font-mono leading-tight truncate">{m.code}</h2>
              <p className="text-[0.875rem] text-[#1D1D1F] font-medium truncate">{m.customer_name}</p>
            </div>
          </div>
          {headerActions}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold"
            style={{ backgroundColor: stage.color + "1A", color: stage.color }}
          >
            <StageIcon className="w-3.5 h-3.5" />
            {stage.label}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold"
            style={{ backgroundColor: opColor + "1A", color: opColor }}
          >
            {operationLabel(m.operation)}
          </span>
          {m.status === "elfogadasra_var" && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold ${
                m.accepted ? "bg-[#34C759]/15 text-[#34C759]" : "bg-[#FFCC00]/25 text-[#9a7b00]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {m.accepted ? "Elfogadva" : "Elfogadásra vár"}
            </span>
          )}
          {m.flagged && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold bg-red-500/10 text-red-500">
              <Flag className="w-3.5 h-3.5" /> Kiemelt
            </span>
          )}
          {m.archived && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-semibold bg-[#86868B]/10 text-[#86868B]">
              <Archive className="w-3.5 h-3.5" /> Archivált
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
        <div className="border-b border-[#EDEDF0] shrink-0">{hero}</div>
        {content}
      </div>
      {editing && (
        <MunkalapEditForm
          munkalap={m}
          onSaved={(updated) => {
            setEditing(false);
            onUpdated(updated);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}