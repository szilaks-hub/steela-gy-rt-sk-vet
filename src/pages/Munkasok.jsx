import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Pencil, Trash2, Loader2, Phone, MapPin, Mail } from "lucide-react";

const STATUS = [
  { value: "elerheto", label: "Elérhető", color: "#34C759" },
  { value: "foglalt", label: "Foglalt", color: "#FF9500" },
  { value: "szabadsagon", label: "Szabadságon", color: "#5B9BD5" },
  { value: "inaktiv", label: "Inaktív", color: "#86868B" },
];

const statusMeta = (v) => STATUS.find((s) => s.value === v) || STATUS[0];

export default function Munkasok() {
  const { toast } = useToast();
  const [munkasok, setMunkasok] = useState([]);
  const [beosztasok, setBeosztasok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", beosztas_id: "", status: "elerheto", phone: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ms, bs] = await Promise.all([
        base44.entities.Munkas.list("-created_date", 500),
        base44.entities.Beosztas.list("-created_date", 500),
      ]);
      setMunkasok(ms);
      setBeosztasok(bs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const beosztasMeta = (id) => beosztasok.find((b) => b.id === id);

  const openNew = () => {
    setForm({ name: "", email: "", beosztas_id: "", status: "elerheto", phone: "" });
    setEditing("new");
  };

  const openEdit = (m) => {
    setForm({ name: m.name || "", email: m.email || "", beosztas_id: m.beosztas_id || "", status: m.status || "elerheto", phone: m.phone || "" });
    setEditing(m);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        beosztas_id: form.beosztas_id,
        status: form.status,
        phone: form.phone.trim(),
      };
      if (editing === "new") {
        await base44.entities.Munkas.create(payload);
        toast({ title: "Munkatárs hozzáadva" });
      } else {
        await base44.entities.Munkas.update(editing.id, payload);
        toast({ title: "Munkatárs frissítve" });
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    await base44.entities.Munkas.delete(m.id);
    toast({ title: "Munkatárs törölve" });
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-[1rem] font-semibold text-[#1D1D1F] leading-none">Munkatársak</h1>
            <p className="text-[0.75rem] text-[#86868B] mt-0.5">Státuszkezelés és beosztás</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1D1D1F] text-white text-[0.875rem] font-medium hover:bg-[#1D1D1F]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Új munkatárs
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#FF9500] rounded-full animate-spin" />
          </div>
        ) : munkasok.length === 0 ? (
          <div className="text-center text-[#86868B] py-24">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-[0.875rem]">Még nincs munkatárs. Adj hozzá egyet a fenti gombbal.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {munkasok.map((m) => {
              const sm = statusMeta(m.status);
              const b = beosztasMeta(m.beosztas_id);
              return (
                <div key={m.id} className="rounded-2xl border border-[#EDEDF0] bg-white p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[0.875rem] font-semibold shrink-0"
                        style={{ backgroundColor: sm.color }}
                      >
                        {(m.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.875rem] font-semibold text-[#1D1D1F] truncate">{m.name}</p>
                        <span
                          className="inline-flex items-center gap-1 mt-0.5 text-[0.6875rem] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: sm.color + "1A", color: sm.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sm.color }} />
                          {sm.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openEdit(m)}
                        className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-8 h-8 rounded-lg text-[#86868B] hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Munkatárs törlése</AlertDialogTitle>
                            <AlertDialogDescription>Biztosan törlöd: {m.name}?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Mégse</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(m)} className="bg-red-500 hover:bg-red-500/90 text-white">
                              Törlés
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[0.8125rem]">
                    {b ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="text-[#1D1D1F] font-medium truncate">{b.name}</span>
                        {b.helyzet && (
                          <span className="inline-flex items-center gap-0.5 text-[#86868B] truncate">
                            <MapPin className="w-3 h-3" /> {b.helyzet}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[#86868B] italic">Nincs beosztás</p>
                    )}
                    {m.email && (
                      <p className="inline-flex items-center gap-1.5 text-[#86868B] truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{m.email}</span>
                      </p>
                    )}
                    {m.phone && (
                      <p className="inline-flex items-center gap-1.5 text-[#86868B]">
                        <Phone className="w-3.5 h-3.5" /> {m.phone}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E5E5EA] shrink-0">
            <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">
              {editing === "new" ? "Új munkatárs" : "Munkatárs szerkesztése"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Név *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Pl. Kovács János"
                className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="pl. munkatars@ceg.hu"
                className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Beosztás</Label>
              <Select value={form.beosztas_id} onValueChange={(v) => setForm({ ...form, beosztas_id: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
                  <SelectValue placeholder="Válassz beosztást" />
                </SelectTrigger>
                <SelectContent>
                  {beosztasok.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {beosztasok.length === 0 && (
                <p className="text-[0.75rem] text-[#86868B]">Előbb hozz létre beosztást a Beosztások oldalon.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Státusz</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Pl. +36 30 123 4567"
                className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
              />
            </div>
          </div>
          <div className="px-5 pb-5 pt-1 flex gap-2.5 shrink-0">
            <button onClick={() => setEditing(null)} className="flex-1 h-11 rounded-xl text-[0.875rem] font-medium text-[#1D1D1F] hover:bg-black/5">
              Mégse
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="flex-1 h-11 rounded-xl bg-[#FF9500] hover:bg-[#FF9500]/90 text-white text-[0.875rem] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mentés"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}