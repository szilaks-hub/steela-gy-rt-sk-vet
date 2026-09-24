import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Factory, LayoutDashboard, BarChart3, Calendar, Users, ChevronDown } from "lucide-react";
import { OPERATIONS } from "@/lib/munkalapConfig";

const navClass = ({ isActive }) =>
  `flex items-center gap-2.5 h-9 px-3 rounded-lg text-[0.8125rem] font-medium transition-colors ${
    isActive ? "bg-[#FF9500]/10 text-[#FF9500]" : "text-[#1D1D1F] hover:bg-black/5"
  }`;

const opClass = (active) =>
  `flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg text-[0.8125rem] transition-colors ${
    active ? "bg-[#1D1D1F] text-white" : "text-[#1D1D1F] hover:bg-black/5"
  }`;

const subClass = ({ isActive }) =>
  `flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg text-[0.8125rem] font-medium transition-colors ${
    isActive ? "bg-[#FF9500]/10 text-[#FF9500]" : "text-[#1D1D1F] hover:bg-black/5"
  }`;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOp = new URLSearchParams(window.location.search).get("operation");
  const [munkatarsOpen, setMunkatarsOpen] = useState(
    location.pathname === "/munkasok" || location.pathname === "/beosztasok"
  );

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7]">
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[#E5E5EA] bg-white/60 backdrop-blur-xl py-4 px-3">
        <div className="flex items-center gap-2.5 px-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white shadow-sm shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.875rem] font-semibold text-[#1D1D1F] leading-tight truncate">FlowWork</p>
            <p className="text-[0.6875rem] text-[#86868B] leading-tight">Gyártáskövető</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="w-4 h-4 shrink-0" /> Csővezeték
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
              className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-[0.8125rem] font-medium text-[#1D1D1F] hover:bg-black/5 transition-colors"
            >
              <Users className="w-4 h-4 shrink-0" /> Munkatársak
              <ChevronDown
                className={`w-3.5 h-3.5 ml-auto text-[#86868B] transition-transform ${munkatarsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {munkatarsOpen && (
              <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-[#E5E5EA] pl-2">
                <NavLink to="/munkasok" className={subClass}>
                  Munkatársak
                </NavLink>
                <NavLink to="/beosztasok" className={subClass}>
                  Beosztások
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <p className="text-[0.625rem] uppercase tracking-wider text-[#86868B] font-semibold mt-5 mb-1.5 px-2.5">
          Munkafolyamatok
        </p>
        <div className="flex flex-col gap-0.5">
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
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}