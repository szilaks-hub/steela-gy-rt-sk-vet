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
  create: "Munkakérés létrehozása",
  edit: "Adatok módosítása",
  befogad: "Befogadás (feldolgozásra)",
  feldolgozas_kesz: "Feldolgozás kész",
  vevonek_kuldve: "Vevőnek küldve",
  megrendel: "Megrendelve — gyártásra kiadás",
  gyartas_indit: "Gyártás indítása",
  gyartas_kesz: "Gyártás kész (rakodható)",
  felrak: "Felrakva — lezárás",
  megszakit: "Munka megszakítva",
  surgo_keres: "Sürgősségi kérés (korábbi időpont)",
  surgo_valasz: "Sürgősségi válasz",
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
  create: "#F5C84B",
  edit: "#5B9BD5",
  befogad: "#FF9500",
  feldolgozas_kesz: "#5AC8FA",
  vevonek_kuldve: "#AF52DE",
  megrendel: "#FF6B35",
  gyartas_indit: "#0A84FF",
  gyartas_kesz: "#34C759",
  felrak: "#8E8E93",
  megszakit: "#FF6961",
  surgo_keres: "#FFCC00",
  surgo_valasz: "#FF9500",
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