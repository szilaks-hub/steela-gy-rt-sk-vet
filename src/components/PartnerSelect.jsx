import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Building2, ChevronDown, Check } from "lucide-react";

export default function PartnerSelect({ value, onChange, placeholder = "Válassz partnert vagy írj be újat…", className = "" }) {
  const [partners, setPartners] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.Partner.list("name", 500);
        if (active) setPartners(list || []);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = (value || "").toLowerCase().trim();
  const matches = q
    ? partners.filter((p) => (p.name || "").toLowerCase().includes(q)).slice(0, 8)
    : partners.slice(0, 8);

  const exact = partners.some((p) => (p.name || "").toLowerCase() === q);

  const pick = (name) => {
    onChange(name);
    setOpen(false);
    setHighlight(-1);
  };

  const onKey = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open && highlight >= 0 && matches[highlight]) {
      e.preventDefault();
      pick(matches[highlight].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-9 rounded-xl bg-[#F5F5F7] border border-transparent text-[0.875rem] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] pointer-events-none" />
      </div>
      {open && (
        <div ref={listRef} className="absolute z-50 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl bg-white border border-[#E5E5EA] shadow-xl py-1.5">
          {!loaded && <p className="px-3 py-2 text-[0.8125rem] text-[#86868B]">Betöltés…</p>}
          {loaded && matches.length === 0 && !exact && q && (
            <p className="px-3 py-2 text-[0.8125rem] text-[#86868B]">Új partnerként rögzítve: „{value}"</p>
          )}
          {loaded && matches.length === 0 && !q && (
            <p className="px-3 py-2 text-[0.8125rem] text-[#86868B]">Még nincs partner rögzítve — írd be a cégnevet.</p>
          )}
          {matches.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => pick(p.name)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${highlight === i ? "bg-[#FF9500]/10" : "hover:bg-black/5"}`}
            >
              <span className="w-7 h-7 rounded-lg bg-[#FF9500]/12 text-[#FF9500] flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8125rem] font-medium text-[#1D1D1F] truncate">{p.name}</span>
                {p.utca && <span className="block text-[0.6875rem] text-[#86868B] truncate">{p.utca}</span>}
              </span>
              {(p.kontaktok || []).length > 0 && (
                <span className="text-[0.625rem] text-[#86868B] shrink-0">{(p.kontaktok || []).length} kontakt</span>
              )}
              {value === p.name && <Check className="w-3.5 h-3.5 text-[#FF9500] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}