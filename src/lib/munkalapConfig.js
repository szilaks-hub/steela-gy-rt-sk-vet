import { FileText, CheckCircle2, Factory, Truck, PackageCheck } from "lucide-react";

export const OPERATIONS = [
  { value: "egyengetes", label: "Egyengetés", color: "#FF9500" },
  { value: "bordazas", label: "Bordázás", color: "#FFCC00" },
  { value: "hajlitas", label: "Hajlítás", color: "#FF6B35" },
  { value: "meretre_vagas", label: "Méretre vágás", color: "#34C759" },
  { value: "halo_hegesztes", label: "Háló hegesztés", color: "#5B9BD5" },
];

export const OPERATION_COLORS = Object.fromEntries(OPERATIONS.map((o) => [o.value, o.color]));

export const STAGES = [
  { value: "terv_feldolgozas", label: "Terv feldolgozás", short: "Terv", icon: FileText, color: "#86868B" },
  { value: "elfogadasra_var", label: "Elfogadásra vár", short: "Elfogadás", icon: CheckCircle2, color: "#FFCC00" },
  { value: "gyartas_folyamatban", label: "Gyártás folyamatban", short: "Gyártás", icon: Factory, color: "#FF9500" },
  { value: "rakodasra_elojegyezve", label: "Rakodásra előjegyezve", short: "Rakodás", icon: Truck, color: "#FF9500" },
  { value: "felrakva_kesz", label: "Felrakva / Kész", short: "Kész", icon: PackageCheck, color: "#34C759" },
];

export const NEXT_STATUS = {
  terv_feldolgozas: "elfogadasra_var",
  elfogadasra_var: "gyartas_folyamatban",
  gyartas_folyamatban: "rakodasra_elojegyezve",
  rakodasra_elojegyezve: "felrakva_kesz",
  felrakva_kesz: null,
};

export const operationLabel = (v) => OPERATIONS.find((o) => o.value === v)?.label || v;
export const operationColor = (v) => OPERATION_COLORS[v] || "#86868B";
export const stageMeta = (v) => STAGES.find((s) => s.value === v) || STAGES[0];

export const progressFor = (status) => {
  const i = STAGES.findIndex((s) => s.value === status);
  return Math.round(((i + 1) / STAGES.length) * 100);
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

export const stageEntryAt = (munkalap, stage) => {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const h = history.find((e) => e.stage === stage);
  if (h) return h.at;
  if (stage === "terv_feldolgozas") return munkalap.created_date;
  return null;
};

export const elapsedMs = (munkalap) => {
  const created = munkalap.created_date ? new Date(munkalap.created_date).getTime() : null;
  if (created == null) return null;
  const lastStage = STAGES[STAGES.length - 1].value;
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