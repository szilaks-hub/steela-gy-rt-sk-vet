import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { STAGES, operationLabel, stageMeta, progressFor, NEXT_STATUS } from "@/lib/munkalapConfig";
import CommentSection from "@/components/CommentSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, ChevronRight, Paperclip, FileText, ExternalLink, Check, Loader2 } from "lucide-react";

export default function MunkalapDetail({ munkalap, onClose, onUpdated }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const m = munkalap;
  const stage = stageMeta(m.status);
  const StageIcon = stage.icon;
  const next = NEXT_STATUS[m.status];
  const canAdvance = next && !(m.status === "elfogadasra_var" && !m.accepted);

  const accept = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.Munkalap.update(m.id, { accepted: true });
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
      const updated = await base44.entities.Munkalap.update(m.id, {
        status: next,
        progress: progressFor(next),
      });
      toast({ title: "Áthelyezve: " + stageMeta(next).label });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-semibold"
          style={{ backgroundColor: stage.color + "1A", color: stage.color }}
        >
          <StageIcon className="w-3.5 h-3.5" />
          {stage.label}
        </span>
        {m.status === "elfogadasra_var" && (
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[0.75rem] font-semibold ${
              m.accepted ? "bg-[#34C759]/15 text-[#34C759]" : "bg-[#FFCC00]/25 text-[#9a7b00]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {m.accepted ? "Elfogadva" : "Elfogadásra vár"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#F5F5F7] p-3">
          <p className="text-[0.75rem] text-[#86868B]">Vevő</p>
          <p className="text-[0.875rem] font-medium text-[#1D1D1F] mt-0.5">{m.customer_name}</p>
        </div>
        <div className="rounded-xl bg-[#F5F5F7] p-3">
          <p className="text-[0.75rem] text-[#86868B]">Művelet</p>
          <p className="text-[0.875rem] font-medium text-[#1D1D1F] mt-0.5">{operationLabel(m.operation)}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[0.75rem] text-[#86868B] mb-1.5">
          <span>Előrehaladás</span>
          <span>{m.progress || 0}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF9500] to-[#FFCC00] transition-all"
            style={{ width: `${m.progress || 0}%` }}
          />
        </div>
      </div>

      {m.description && (
        <div>
          <p className="text-[0.75rem] text-[#86868B] mb-1">Leírás</p>
          <p className="text-[0.875rem] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">{m.description}</p>
        </div>
      )}

      <div>
        <p className="text-[0.75rem] text-[#86868B] mb-2 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" />
          Dokumentumok ({(m.documents || []).length})
        </p>
        <div className="space-y-2">
          {(m.documents || []).length === 0 && (
            <p className="text-[0.8125rem] text-[#86868B] italic">Nincs csatolt dokumentum</p>
          )}
          {(m.documents || []).map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-[#E5E5EA] p-2.5 hover:border-[#FF9500]/40 transition-colors group"
            >
              <span className="w-9 h-9 rounded-lg bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <span className="flex-1 text-[0.8125rem] text-[#1D1D1F] truncate">Dokumentum {i + 1}</span>
              <ExternalLink className="w-4 h-4 text-[#86868B] group-hover:text-[#FF9500] shrink-0" />
            </a>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[#E5E5EA]">
        <p className="text-[0.75rem] text-[#86868B] mb-3 mt-2">Megjegyzések</p>
        <CommentSection munkalapId={m.id} />
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-[#E5E5EA] px-5 py-3.5 bg-white space-y-2">
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
    </div>
  );

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      {body}
      {footer}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={true} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="h-[90vh] flex flex-col gap-0">
          <DrawerHeader className="px-5 pt-3 pb-2 border-b border-[#E5E5EA]">
            <DrawerTitle className="text-[1rem] font-semibold text-[#1D1D1F] font-mono">{m.code}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={true} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-[#E5E5EA]">
          <SheetTitle className="text-[1rem] font-semibold text-[#1D1D1F] font-mono">{m.code}</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}