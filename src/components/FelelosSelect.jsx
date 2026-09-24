import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown } from "lucide-react";

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

  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={loading}
        className={`w-full px-3 pr-9 appearance-none cursor-pointer disabled:opacity-60 ${
          className || "h-11 rounded-xl bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]"
        }`}
      >
        <option value="" disabled>
          {loading ? "betöltés…" : "Válassz munkatársat"}
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.name}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868B]" />
    </div>
  );
}