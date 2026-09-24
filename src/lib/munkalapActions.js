import { base44 } from "@/api/base44Client";
import { progressFor, stageMeta } from "@/lib/munkalapConfig";
import { logAudit } from "@/lib/auditLog";

export function makeHistoryEntry(stage, note) {
  return { stage, at: new Date().toISOString(), note: note || "" };
}

export async function advanceMunkalap(munkalap, nextStatus) {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const entry = makeHistoryEntry(nextStatus, `Áthelyezve: ${stageMeta(nextStatus).label}`);
  const updated = await base44.entities.Munkalap.update(munkalap.id, {
    status: nextStatus,
    progress: progressFor(nextStatus),
    stage_history: [...history, entry],
  });
  logAudit({
    action: "advance",
    munkalap_id: munkalap.id,
    munkalap_code: munkalap.code,
    from_status: munkalap.status,
    to_status: nextStatus,
    quantity_kg: Number(munkalap.quantity_kg) || 0,
  });
  return updated;
}

export async function acceptMunkalap(munkalap) {
  const updated = await base44.entities.Munkalap.update(munkalap.id, {
    accepted: true,
    elfogadva_at: new Date().toISOString(),
  });
  logAudit({
    action: "accept",
    munkalap_id: munkalap.id,
    munkalap_code: munkalap.code,
    quantity_kg: Number(munkalap.quantity_kg) || 0,
  });
  return updated;
}