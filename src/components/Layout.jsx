import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BarChart3, Calendar, Users, ChevronDown } from "lucide-react";
import { OPERATIONS } from "@/lib/munkalapConfig";
import Logo from "@/components/Logo";

const navClass = ({ isActive }) =>
  `flex items-center gap-2.5 h-9 px-3 rounded-xl text-[0.8125rem] font-medium transition-all duration-200 ${
    isActive ? "bg-[#FF9500]/15 text-[#FF9500] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]" : "text-[#1D1D1F] hover:bg-white/50 hover:translate-x-0.5"
  }`;

const opClass = (active) =>
  `flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-xl text-[0.8125rem] transition-all duration-200 ${
    active ? "bg-[#1D1D1F] text-white shadow-sm" : "text-[#1D1D1F] hover:bg-white/50 hover:translate-x-0.5"
  }`;

const subClass = ({ isActive }) =>
  `flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-xl text-[0.8125rem] font-medium transition-all duration-200 ${
    isActive ? "bg-[#FF9500]/15 text-[#FF9500]" : "text-[#1D1D1F] hover:bg-white/50 hover:translate-x-0.5"
  }`;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" },
});

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOp = new URLSearchParams(window.location.search).get("operation");
  const [munkatarsOpen, setMunkatarsOpen] = useState(
    location.pathname === "/munkasok" || location.pathname === "/beosztasok"
  );

  return (
    <div className="flex h-screen w-full overflow-hidden p-3 gap-3">
      {/* Floating glass sidebar pill */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 steela-glass-side rounded-[28px] py-4 px-3">
        <motion.div {...fadeUp(0)} className="flex items-center gap-2.5 px-1 mb-5">
          <Logo variant="full" size={34} />
        </motion.div>

        <motion.nav {...fadeUp(0.05)} className="flex flex-col gap-1">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="w-4 h-4 shrink-0" /> STEELA Cetli
          </NavLink>
          <NavLink to="/naptar" className={navClass}>
            <Calendar className="w-4 h-4 shrink-0" /> Naptár
          </NavLink>
          <NavLink to="/dashboard" className={navClass}>
            <BarChart3 className="w-4 h-4 shrink-0" /> Áttekintés
          </NavLink>
          <div className="flex flex-col">
            <button
              onClick={() => setMunkatarsOpen((v) => !v)}
              className="flex items-center gap-2.5 h-9 px-3 rounded-xl text-[0.8125rem] font-medium text-[#1D1D1F] hover:bg-white/50 transition-colors"
            >
              <Users className="w-4 h-4 shrink-0" /> Munkatársak
              <ChevronDown
                className={`w-3.5 h-3.5 ml-auto text-[#86868B] transition-transform duration-300 ${munkatarsOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {munkatarsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-white/40 pl-2">
                    <NavLink to="/beosztasok" className={subClass}>
                      Beosztások
                    </NavLink>
                    <NavLink to="/munkasok" className={subClass}>
                      Munkatársak
                    </NavLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.nav>

        <motion.p {...fadeUp(0.1)} className="text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold mt-5 mb-1.5 px-2.5">
          Munkafolyamatok
        </motion.p>
        <motion.div {...fadeUp(0.12)} className="flex flex-col gap-0.5">
          <button
            onClick={() => navigate("/")}
            className={opClass(!currentOp)}
          >
            <span className="w-2 h-2 rounded-full bg-[#86868B] shrink-0" />
            Összes
          </button>
          {OPERATIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => navigate(`/?operation=${o.value}`)}
              className={opClass(currentOp === o.value)}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
              {o.label}
            </button>
          ))}
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="mt-auto pt-4 px-2">
          <p className="text-[0.625rem] text-[#86868B] tracking-wide">Production made clear.</p>
        </motion.div>
      </aside>

      {/* Main frosted-glass panel */}
      <main className="flex-1 min-w-0 relative overflow-hidden steela-glass-main rounded-[28px]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <Logo variant="watermark" size={560} />
        </div>
        <div className="relative z-10 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}