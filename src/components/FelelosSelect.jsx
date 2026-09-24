import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// Csak az előkészítésre és hegesztésre regisztrált munkatársak választhatók felelősnek
const ROLE_RE = /elokeszt|hegeszt/;

export default function FelelosSelect({ value, onChange, className }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [munkasok, beosztasok] = await Promise.all([
          base44.entities.Munkas.list("-created_date", 500),
          base44.entities.Beosztas.list("-created_date", 500),
        ]);
        const roleOf = (id) => (beosztasok || []).find((b) => b.id === id)?.name || "";
        let filtered = (munkasok || []).filter((mk) => ROLE_RE.test(norm(roleOf(mk.beosztas_id))));
        if (filtered.length === 0) filtered = munkasok || [];
        if (active) setOptions(filtered);
      } catch {
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => {
    const list = (options || []).map((o) => ({ id: o.id, name: o.name }));
    if (value && !list.find((o) => o.name === value)) {
      list.unshift({ id: "_current", name: value });
    }
    return list;
  }, [options, value]);

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={className}>
        {loading && !value ? (
          <span className="flex items-center gap-2 text-[#86868B]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> betöltés…
          </span>
        ) : (
          <SelectValue placeholder="Válassz munkatársat" />
        )}
      </SelectTrigger>
      <SelectContent>
        {items.length === 0 && (
          <p className="px-3 py-2 text-[0.8125rem] text-[#86868B]">Nincs választható munkatárs.</p>
        )}
        {items.map((o) => (
          <SelectItem key={o.id} value={o.name}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}