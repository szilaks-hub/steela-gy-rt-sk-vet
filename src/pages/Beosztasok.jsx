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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, Pencil, Trash2, Loader2, MapPin, X } from "lucide-react";

const COLORS = [
  "#FF9500", "#FFCC00", "#FF6B35", "#34C759", "#5B9BD5",
  "#AF52DE", "#FF3B30", "#86868B", "#00C7BE", "#FF2D55",
];

export default function Beosztasok() {
  const { toast } = useToast();
  const [helyek, setHelyek] = useState([]);
  const [beosztasok, setBeosztasok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0], helyzet: "" });
  const [saving, setSaving] = useState(false);
  const [newHely, setNewHely] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [h, b] = await Promise.all([
        base44.entities.TelepiHely.list("-created_date", 500),
        base44.entities.Beosztas.list("-created_date", 500),
      ]);
      setHelyek(h);
      setBeosztasok(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addHely = async () => {
    if (!newHely.trim()) return;
    const color = COLORS[helyek.length % COLORS.length];
    await base44.entities.TelepiHely.create({ name: newHely.trim(), color });
    setNewHely("");
    toast({ title: "Telepi hely hozzáadva" });
    load();
  };

  const removeHely = async (h) => {
    await base44.entities.TelepiHely.delete(h.id);
    toast({ title: "Telepi hely törölve" });
    load();
  };

  const openNew = () => {
    setForm({ name: "", description: "", color: COLORS[0], helyzet: helyek[0]?.name || "" });
    setEditing("new");
  };

  const openEdit = (b) => {
    setForm({ name: b.name || "", description: b.description || "", color: b.color || COLORS[0], helyzet: b.helyzet || "" });
    setEditing(b);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        helyzet: form.helyzet,
      };
      if (editing === "new") {
        await base44.entities.Beosztas.create(payload);
        toast({ title: "Beosztás hozzáadva" });
      } else {
        await base44.entities.Beosztas.update(editing.id, payload);
        toast({ title: "Beosztás frissítve" });
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b) => {
    await base44.entities.Beosztas.delete(b.id);
    toast({ title: "Beosztás törölve" });
    load();
  };

  const helyColor = (name) => helyek.find((h) => h.name === name)?.color || "#86868B";

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-[1rem] font-semibold text-[#1D1D1F] leading-none">Beosztások</h1>
            <p className="text-[0.75rem] text-[#86868B] mt-0.5">Beosztások és telepi helyek kezelése</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1D1D1F] text-white text-[0.875rem] font-medium hover:bg-[#1D1D1F]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Új beosztás
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#FF9500] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Telepi helyek */}
            <section className="rounded-2xl border border-[#EDEDF0] bg-white p-4">
              <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-3 inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Telepen belüli helyek
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {helyek.map((h) => (
                  <span
                    key={h.id}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border border-[#EDEDF0] bg-[#FBFBFD]"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                    <span className="text-[0.8125rem] font-medium text-[#1D1D1F]">{h.name}</span>
                    <button
                      onClick={() => removeHely(h)}
                      className="w-5 h-5 rounded-full text-[#86868B] hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {helyek.length === 0 && (
                  <p className="text-[0.8125rem] text-[#86868B] italic">Még nincs telepi hely. Adj hozzá egyet lent.</p>
                )}
                <div className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#E5E5EA] pl-2.5 pr-1 py-1">
                  <input
                    value={newHely}
                    onChange={(e) => setNewHely(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addHely()}
                    placeholder="Új hely (pl. Raktár)"
                    className="h-6 bg-transparent text-[0.8125rem] outline-none w-32 placeholder:text-[#86868B]"
                  />
                  <button
                    onClick={addHely}
                    disabled={!newHely.trim()}
                    className="w-6 h-6 rounded-full bg-[#FF9500] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#FF9500]/90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* Beosztások */}
            <section>
              <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold mb-3">
                Beosztások ({beosztasok.length})
              </p>
              {beosztasok.length === 0 ? (
                <div className="text-center text-[#86868B] py-16 rounded-2xl border border-dashed border-[#E5E5EA]">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-[0.875rem]">Még nincs beosztás. Hozd létre az elsőt a fenti gombbal.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {beosztasok.map((b) => {
                    const hc = helyColor(b.helyzet);
                    return (
                      <div key={b.id} className="rounded-2xl border border-[#EDEDF0] bg-white p-4 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: b.color + "1A" }}>
                              <span className="w-4 h-4 rounded-md" style={{ backgroundColor: b.color }} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[0.875rem] font-semibold text-[#1D1D1F] truncate">{b.name}</p>
                              {b.helyzet && (
                                <span className="inline-flex items-center gap-1 mt-0.5 text-[0.6875rem] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: hc + "1A", color: hc }}>
                                  <MapPin className="w-3 h-3" /> {b.helyzet}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => openEdit(b)}
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
                                  <AlertDialogTitle>Beosztás törlése</AlertDialogTitle>
                                  <AlertDialogDescription>Biztosan törlöd: {b.name}?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Mégse</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => remove(b)} className="bg-red-500 hover:bg-red-500/90 text-white">
                                    Törlés
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {b.description && (
                          <p className="mt-3 text-[0.8125rem] text-[#86868B] leading-relaxed">{b.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md p-0 gap-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E5E5EA] shrink-0">
            <DialogTitle className="text-[1rem] font-semibold text-[#1D1D1F]">
              {editing === "new" ? "Új beosztás" : "Beosztás szerkesztése"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Beosztás neve *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Pl. Kereskedő"
                className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Telepen belüli helyzet</Label>
              <Select value={form.helyzet} onValueChange={(v) => setForm({ ...form, helyzet: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
                  <SelectValue placeholder="Válassz helyet" />
                </SelectTrigger>
                <SelectContent>
                  {helyek.map((h) => (
                    <SelectItem key={h.id} value={h.name}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {helyek.length === 0 && (
                <p className="text-[0.75rem] text-[#86868B]">Előbb adj hozzá telepi helyet a fenti sávban.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Szín</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${form.color === c ? "ring-2 ring-offset-2 ring-[#1D1D1F] scale-110" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  >
                    {form.color === c && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.8125rem] text-[#1D1D1F] font-medium">Leírás</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mit takar ez a beosztás? Milyen feladatokat végez?"
                rows={3}
                className="rounded-xl bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
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