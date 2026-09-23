import { base44 } from "@/api/base44Client";
import { progressFor, stageMeta } from "@/lib/munkalapConfig";

export function makeHistoryEntry(stage, note) {
  return { stage, at: new Date().toISOString(), note: note || "" };
}

export async function advanceMunkalap(munkalap, nextStatus) {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const entry = makeHistoryEntry(nextStatus, `Áthelyezve: ${stageMeta(nextStatus).label}`);
  return await base44.entities.Munkalap.update(munkalap.id, {
    status: nextStatus,
    progress: progressFor(nextStatus),
    stage_history: [...history, entry],
  });
}

export async function acceptMunkalap(munkalap) {
  return await base44.entities.Munkalap.update(munkalap.id, {
    accepted: true,
    elfogadva_at: new Date().toISOString(),
  });
}