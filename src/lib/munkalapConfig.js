import { FileText, CheckCircle2, Factory, Truck, PackageCheck } from "lucide-react";

export const OPERATIONS = [
  { value: "egyengetes", label: "Egyengetés" },
  { value: "bordazas", label: "Bordázás" },
  { value: "hajlitas", label: "Hajlítás" },
  { value: "meretre_vagas", label: "Méretre vágás" },
  { value: "halo_hegesztes", label: "Háló hegesztés" },
];

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
export const stageMeta = (v) => STAGES.find((s) => s.value === v) || STAGES[0];

export const progressFor = (status) => {
  const i = STAGES.findIndex((s) => s.value === status);
  return Math.round(((i + 1) / STAGES.length) * 100);
};