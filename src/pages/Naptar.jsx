import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { operationColor } from "@/lib/munkalapConfig";
import MunkalapDetail from "@/components/MunkalapDetail";
import { ChevronLeft, ChevronRight, Factory, Truck, Loader2 } from "lucide-react";

const WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Naptar() {
  const [munkalapok, setMunkalapok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("gyartasi");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const list = await base44.entities.Munkalap.list("-created_date", 500);
      setMunkalapok(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const dateField = mode === "gyartasi" ? "gyartasi_datum" : "kiszallitasi_datum";

  const byDate = useMemo(() => {
    const map = {};
    munkalapok.forEach((m) => {
      const d = m[dateField];
      if (d) (map[d] = map[d] || []).push(m);
    });
    return map;
  }, [munkalapok, dateField]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleDateString("hu-HU", { year: "numeric", month: "long" });
  const todayStr = fmt(new Date());

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl shrink-0">
        <h1 className="text-[1rem] font-semibold text-[#1D1D1F]">Naptár</h1>
        <div className="ml-auto flex items-center gap-1 bg-[#F5F5F7] rounded-full p-1">
          <button
            onClick={() => setMode("gyartasi")}
            className={`inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[0.8125rem] font-medium transition-colors ${
              mode === "gyartasi" ? "bg-[#1D1D1F] text-white" : "text-[#86868B]"
            }`}
          >
            <Factory className="w-3.5 h-3.5" /> Gyártási
          </button>
          <button
            onClick={() => setMode("kiszallitasi")}
            className={`inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[0.8125rem] font-medium transition-colors ${
              mode === "kiszallitasi" ? "bg-[#1D1D1F] text-white" : "text-[#86868B]"
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Kiszállítási
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-[#FF9500] animate-spin" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-[#1D1D1F]" />
              </button>
              <h2 className="text-[1.0625rem] font-semibold text-[#1D1D1F] capitalize">{monthLabel}</h2>
              <button
                onClick={() => setCursor(new Date(year, month + 1, 1))}
                className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-[#1D1D1F]" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[0.75rem] font-medium text-[#86868B] py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const ds = fmt(new Date(year, month, d));
                const items = byDate[ds] || [];
                const isToday = ds === todayStr;
                return (
                  <div
                    key={i}
                    className={`min-h-[88px] rounded-xl border p-1.5 ${
                      isToday ? "border-[#FF9500] bg-[#FF9500]/5" : "border-[#E5E5EA] bg-white"
                    }`}
                  >
                    <div className={`text-[0.75rem] font-medium mb-1 ${isToday ? "text-[#FF9500]" : "text-[#86868B]"}`}>
                      {d}
                    </div>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelected(m)}
                          className="w-full text-left rounded-md px-1.5 py-1 text-[0.6875rem] font-medium truncate"
                          style={{ backgroundColor: operationColor(m.operation) + "26", color: operationColor(m.operation) }}
                          title={`${m.code} • ${m.customer_name}`}
                        >
                          {m.code}
                        </button>
                      ))}
                      {items.length > 3 && (
                        <div className="text-[0.6875rem] text-[#86868B] px-1.5">+{items.length - 3} további</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[0.75rem] text-[#86868B] text-center">
              A munkalapok színe a műveletnek megfelelő. Kattints egy kódra a részletekért.
            </p>
          </div>
        )}
      </div>

      {selected && (
        <MunkalapDetail
          munkalap={selected}
          onClose={() => setSelected(null)}
          onUpdated={(m) => {
            setSelected(m);
            load();
          }}
        />
      )}
    </div>
  );
}