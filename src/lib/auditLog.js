import { base44 } from "@/api/base44Client";

let _me = null;
let _mePromise = null;
async function getMe() {
  if (_me) return _me;
  if (_mePromise) return _mePromise;
  _mePromise = base44.auth
    .me()
    .then((m) => {
      _me = m;
      return m;
    })
    .catch(() => null);
  return _mePromise;
}

/**
 * Központi audit-logoló. Minden felhasználói műveletet rögzít.
 * Soha nem dob hibát — a logolás nem törheti meg a folyamatot.
 */
export async function logAudit({ action, munkalap_id, munkalap_code, ...rest }) {
  try {
    const me = await getMe();
    await base44.entities.AuditLog.create({
      actor_email: me?.email || "",
      actor_name: me?.full_name || me?.email || "",
      action,
      munkalap_id: munkalap_id || "",
      munkalap_code: munkalap_code || "",
      from_status: rest.from_status || "",
      to_status: rest.to_status || "",
      quantity_kg: rest.quantity_kg ?? 0,
      worker_id: rest.worker_id || "",
      worker_name: rest.worker_name || "",
      note: rest.note || "",
    });
  } catch {
    /* a logolás sosem törheti meg a műveletet */
  }
}

export const ACTION_LABELS = {
  create: "Munkalap létrehozása",
  edit: "Adatok módosítása",
  advance: "Fázis léptetése",
  accept: "Elfogadás",
  assign_worker: "Munkás hozzárendelése",
  unassign_worker: "Munkás eltávolítása",
  flag: "Kiemeltre jelölés",
  unflag: "Jelölés eltávolítása",
  archive: "Archiválás",
  restore: "Visszaállítás",
  delete: "Törlés",
  comment: "Megjegyzés",
  document_upload: "Dokumentum csatolása",
  document_remove: "Dokumentum eltávolítása",
};

export const ACTION_COLORS = {
  create: "#34C759",
  edit: "#5B9BD5",
  advance: "#FF9500",
  accept: "#34C759",
  assign_worker: "#5B9BD5",
  unassign_worker: "#86868B",
  flag: "#FF3B30",
  unflag: "#86868B",
  archive: "#86868B",
  restore: "#34C759",
  delete: "#FF3B30",
  comment: "#AF52DE",
  document_upload: "#FFCC00",
  document_remove: "#86868B",
};