import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { OPERATIONS, STAGES, progressFor } from "@/lib/munkalapConfig";
import MunkalapCard from "@/components/MunkalapCard";
import MunkalapForm from "@/components/MunkalapForm";
import MunkalapDetail from "@/components/MunkalapDetail";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Factory } from "lucide-react";

const NEXT = {
  terv_feldolgozas: "elfogadasra_var",
  elfogadasra_var: "gyartas_folyamatban",
  gyartas_folyamatban: "rakodasra_elojegyezve",
  rakodasra_elojegyezve: "felrakva_kesz",
};

export default function Home() {
  const isMobile = useIsMobile();
  const [munkalapok, setMunkalapok] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [opFilter, setOpFilter] = useState("all");
  const [activeStage, setActiveStage] = useState(STAGES[0].value);
  const [selected, setSelected] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Munkalap.list("-created_date", 500);
      setMunkalapok(list);
      const comments = await base44.entities.Megjegyzes.list("-created_date", 500);
      const counts = {};
      comments.forEach((c) => {
        counts[c.munkalap_id] = (counts[c.munkalap_id] || 0) + 1;
      });
      setCommentCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      munkalapok.filter((m) => {
        const matchSearch =
          !search ||
          m.code?.toLowerCase().includes(search.toLowerCase()) ||
          m.customer_name?.toLowerCase().includes(search.toLowerCase());
        const matchOp = opFilter === "all" || m.operation === opFilter;
        return matchSearch && matchOp;
      }),
    [munkalapok, search, opFilter]
  );

  const byStage = (stage) => filtered.filter((m) => m.status === stage);

  const advance = async (m) => {
    const next = NEXT[m.status];
    if (!next) return;
    if (m.status === "elfogadasra_var" && !m.accepted) return;
    await base44.entities.Munkalap.update(m.id, { status: next, progress: progressFor(next) });
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 md:px-6 h-16 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white">
            <Factory className="w-4 h-4" />
          </div>
        </div>
        <div className="hidden md:block shrink-0">
          <h1 className="text-[1rem] font-semibold text-[#1D1D1F] leading-none">Gyártáskövető</h1>
          <p className="text-[0.75rem] text-[#86868B] mt-0.5">Produkciós csővezeték</p>
        </div>
        <div className="flex-1 max-w-md mx-auto md:mx-0 md:ml-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés kód vagy vevő szerint…"
            className="pl-9 h-10 rounded-full bg-[#F5F5F7] border-transparent focus-visible:ring-[#FF9500]"
          />
        </div>
        <div className="hidden sm:block w-44 shrink-0">
          <Select value={opFilter} onValueChange={setOpFilter}>
            <SelectTrigger className="h-10 rounded-full bg-[#F5F5F7] border-transparent focus:ring-[#FF9500]">
              <SelectValue placeholder="Művelet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Összes művelet</SelectItem>
              {OPERATIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <MunkalapForm onCreated={load} />
      </header>

      {!isMobile && (
        <div className="flex-1 overflow-x-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#FF9500] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex gap-4 min-w-max h-full">
              {STAGES.map((stage) => {
                const items = byStage(stage.value);
                const Icon = stage.icon;
                return (
                  <div key={stage.value} className="flex-1 min-w-[260px] flex flex-col">
                    <div className="flex items-center justify-between px-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: stage.color + "1A", color: stage.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <h2 className="text-[0.9375rem] font-semibold text-[#1D1D1F]">{stage.label}</h2>
                      </div>
                      <span className="text-[0.75rem] font-medium text-[#86868B] bg-[#E5E5EA]/60 rounded-full px-2 py-0.5">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-2">
                      {items.map((m) => (
                        <MunkalapCard
                          key={m.id}
                          munkalap={m}
                          commentCount={commentCounts[m.id] || 0}
                          onOpen={setSelected}
                          onAdvance={advance}
                        />
                      ))}
                      {items.length === 0 && (
                        <div className="text-center text-[0.8125rem] text-[#86868B] py-10 border border-dashed border-[#E5E5EA] rounded-xl">
                          Nincs munkalap
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isMobile && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-[#E5E5EA] no-scrollbar">
            {STAGES.map((stage) => {
              const Icon = stage.icon;
              const active = activeStage === stage.value;
              return (
                <button
                  key={stage.value}
                  onClick={() => setActiveStage(stage.value)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[0.8125rem] font-medium transition-colors ${
                    active ? "bg-[#1D1D1F] text-white" : "bg-[#E5E5EA]/60 text-[#86868B]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {stage.short}
                  <span className="opacity-70">{byStage(stage.value).length}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#E5E5EA] border-t-[#FF9500] rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {byStage(activeStage).map((m) => (
                  <MunkalapCard
                    key={m.id}
                    munkalap={m}
                    commentCount={commentCounts[m.id] || 0}
                    onOpen={setSelected}
                    onAdvance={advance}
                  />
                ))}
                {byStage(activeStage).length === 0 && (
                  <div className="text-center text-[0.8125rem] text-[#86868B] py-16">
                    Nincs munkalap ebben a fázisban
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

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