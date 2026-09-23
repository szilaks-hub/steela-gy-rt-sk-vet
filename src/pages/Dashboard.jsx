import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, STAGES } from "@/lib/munkalapConfig";
import { Factory, CheckCircle2, PackageCheck, ClipboardList, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";

const OP_COLORS = ["#FF9500", "#FFCC00", "#FF6B35", "#34C759", "#5B9BD5"];

export default function Dashboard() {
  const [munkalapok, setMunkalapok] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Munkalap.list("-created_date", 500);
        setMunkalapok(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const count = (fn) => munkalapok.filter((m) => m.archived !== true && fn(m)).length;

  const stats = [
    { label: "Összes munkalap", value: count(() => true), Icon: ClipboardList, color: "#1D1D1F" },
    { label: "Gyártásban", value: count((m) => m.status === "gyartas_folyamatban"), Icon: Factory, color: "#FF9500" },
    { label: "Elfogadásra vár", value: count((m) => m.status === "elfogadasra_var" && !m.accepted), Icon: CheckCircle2, color: "#FFCC00" },
    { label: "Kész", value: count((m) => m.status === "felrakva_kesz"), Icon: PackageCheck, color: "#34C759" },
  ];

  const stageData = STAGES.map((s) => ({
    name: s.short,
    count: count((m) => m.status === s.value),
    color: s.color,
  }));

  const opData = OPERATIONS.map((o, i) => ({
    name: o.label,
    value: count((m) => m.operation === o.value),
    color: OP_COLORS[i],
  })).filter((d) => d.value > 0);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl shrink-0">
        <h1 className="text-[1rem] font-semibold text-[#1D1D1F]">Áttekintés</h1>
        <p className="text-[0.75rem] text-[#86868B] ml-3 hidden sm:block">Gyártási statisztikák</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-[#FF9500] animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: s.color + "14", color: s.color }}
                  >
                    <s.Icon className="w-5 h-5" />
                  </span>
                  <p className="mt-4 text-[1.625rem] font-semibold text-[#1D1D1F] leading-none">{s.value}</p>
                  <p className="mt-1.5 text-[0.8125rem] text-[#86868B]">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-4">Munkalapok fázisonként</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#86868B" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#86868B" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#F5F5F7" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E5E5EA",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 8, 8]} maxBarSize={64}>
                        {stageData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[0.9375rem] font-semibold text-[#1D1D1F] mb-4">Műveletek megoszlása</h3>
                {opData.length === 0 ? (
                  <p className="text-[0.8125rem] text-[#86868B] py-16 text-center">Nincs adat</p>
                ) : (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={opData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {opData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #E5E5EA",
                              fontSize: 13,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 space-y-2">
                      {opData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2 text-[0.8125rem]">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="flex-1 text-[#1D1D1F]">{d.name}</span>
                          <span className="text-[#86868B] font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}