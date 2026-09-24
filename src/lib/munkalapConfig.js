import {
  FileText,
  Wrench,
  CheckCircle2,
  MessageSquare,
  BadgeCheck,
  Factory,
  Truck,
  PackageCheck,
  Ban,
} from "lucide-react";

export const OPERATIONS = [
  { value: "egyengetes", label: "Egyengetés", color: "#FF9500" },
  { value: "bordazas", label: "Bordázás", color: "#FFCC00" },
  { value: "hajlitas", label: "Hajlítás", color: "#FF6B35" },
  { value: "meretre_vagas", label: "Méretre vágás", color: "#34C759" },
  { value: "halo_hegesztes", label: "Háló hegesztés", color: "#5B9BD5" },
];

export const OPERATION_COLORS = Object.fromEntries(OPERATIONS.map((o) => [o.value, o.color]));

export const KERES_TIPUSOK = [
  { value: "halo_rajz", label: "Hálórajz feldolgozása" },
  { value: "hajlitasi_terv", label: "Hajlítási terv feldolgozása" },
  { value: "mennyiseg", label: "Mennyiség meghatározása" },
  { value: "gyarthatosag", label: "Gyárthatóság ellenőrzése" },
  { value: "egyengetes", label: "Egyengetési igény" },
  { value: "bordazas", label: "Bordázási igény" },
  { value: "meretre_vagas", label: "Méretre vágás" },
  { value: "halo_hegesztes", label: "Hálóhegesztés" },
  { value: "arajanlat", label: "Árajánlat műszaki feldolgozás" },
  { value: "egyeb", label: "Egyéb gyártási kérdés" },
];

export const MEGSZAKITAS_OKOK = [
  { value: "vevo_lemondta", label: "Vevő lemondta" },
  { value: "ajanlat_nem_elfogadva", label: "Ajánlatot nem fogadta el" },
  { value: "ar_miatt", label: "Ár miatt elveszett" },
  { value: "hatarido_miatt", label: "Határidő miatt elveszett" },
  { value: "muszakilag_nem", label: "Műszakilag nem megvalósítható" },
  { value: "duplikalt", label: "Duplikált kérés" },
  { value: "projekt_elmaradt", label: "Projekt elmaradt" },
  { value: "egyeb", label: "Egyéb" },
];

export const STAGES = [
  { value: "munkakeres", label: "Munkakérés", short: "Kérés", icon: FileText, color: "#F5C84B" },
  { value: "feldolgozas_alatt", label: "Feldolgozás alatt", short: "Feldolgozás", icon: Wrench, color: "#FF9500" },
  { value: "elkeszitve", label: "Elkészítve", short: "Elkészítve", icon: CheckCircle2, color: "#5AC8FA" },
  { value: "vevoi_dontes", label: "Vevői döntés", short: "Vevőre vár", icon: MessageSquare, color: "#AF52DE" },
  { value: "gyartasra_kiadva", label: "Gyártásra kiadva", short: "Kiadva", icon: BadgeCheck, color: "#FF6B35" },
  { value: "gyartasban", label: "Gyártásban", short: "Gyártás", icon: Factory, color: "#0A84FF" },
  { value: "rakodhato", label: "Rakodható", short: "Rakodható", icon: Truck, color: "#34C759" },
  { value: "lezarva", label: "Lezárva", short: "Lezárva", icon: PackageCheck, color: "#8E8E93" },
  { value: "megszakitva", label: "Megszakítva", short: "Megszakítva", icon: Ban, color: "#FF6961" },
];

export const NEXT_STATUS = {
  munkakeres: "feldolgozas_alatt",
  feldolgozas_alatt: "elkeszitve",
  elkeszitve: "vevoi_dontes",
  vevoi_dontes: "gyartasra_kiadva",
  gyartasra_kiadva: "gyartasban",
  gyartasban: "rakodhato",
  rakodhato: "lezarva",
  lezarva: null,
  megszakitva: null,
};

export const operationLabel = (v) => OPERATIONS.find((o) => o.value === v)?.label || v;
export const operationColor = (v) => OPERATION_COLORS[v] || "#86868B";
export const stageMeta = (v) => STAGES.find((s) => s.value === v) || STAGES[0];
export const keresTipusLabel = (v) => KERES_TIPUSOK.find((t) => t.value === v)?.label || v;
export const megszakitasOkLabel = (v) => MEGSZAKITAS_OKOK.find((o) => o.value === v)?.label || v;

export const progressFor = (status) => {
  const i = STAGES.findIndex((s) => s.value === status);
  if (i < 0) return 0;
  return Math.round(((i + 1) / 8) * 100);
};

export const formatDate = (d) => {
  if (!d) return "";
  const parts = String(d).split("-");
  if (parts.length !== 3) return d;
  const [y, m, dd] = parts.map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
};

export const deadlineStatus = (d) => {
  if (!d) return null;
  const parts = String(d).split("-");
  if (parts.length !== 3) return null;
  const [y, m, dd] = parts.map(Number);
  const target = new Date(y, m - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff < 0) return { label: "Lejárt", color: "#FF3B30", diff };
  if (diff === 0) return { label: "Ma", color: "#FF9500", diff };
  if (diff <= 3) return { label: `${diff} nap`, color: "#FF9500", diff };
  return { label: `${diff} nap`, color: "#34C759", diff };
};

export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 óra

export const staleInfo = (munkalap) => {
  const status = munkalap.status;
  let since = null;
  if (status === "munkakeres") {
    since = munkalap.created_date ? new Date(munkalap.created_date).getTime() : null;
  } else if (status === "vevoi_dontes") {
    const at = stageEntryAt(munkalap, "vevoi_dontes");
    since = at ? new Date(at).getTime() : null;
  } else {
    return null;
  }
  if (since == null) return null;
  const ms = Date.now() - since;
  if (ms < STALE_THRESHOLD_MS) return null;
  const hours = Math.floor(ms / 3600000);
  return { ms, hours, stale: true };
};

export const stageEntryAt = (munkalap, stage) => {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const h = history.find((e) => e.stage === stage);
  if (h) return h.at;
  if (stage === "munkakeres") return munkalap.created_date;
  return null;
};

export const elapsedMs = (munkalap) => {
  const created = munkalap.created_date ? new Date(munkalap.created_date).getTime() : null;
  if (created == null) return null;
  const lastStage = "lezarva";
  const lastAt = stageEntryAt(munkalap, lastStage);
  const end = lastAt ? new Date(lastAt).getTime() : Date.now();
  return end - created;
};

export const formatDays = (ms) => {
  if (ms == null || ms < 0 || !isFinite(ms)) return "—";
  const days = ms / 86400000;
  if (days >= 10) return `${Math.round(days)} nap`;
  return `${days.toFixed(1).replace(".", ",")} nap`;
};

export const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("hu-HU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};