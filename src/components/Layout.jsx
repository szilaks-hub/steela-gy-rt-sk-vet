import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Factory, LayoutDashboard, BarChart3, Calendar } from "lucide-react";

const navClass = ({ isActive }) =>
  `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
    isActive ? "bg-[#FF9500]/10 text-[#FF9500]" : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
  }`;

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-[#F5F5F7]">
      <aside className="hidden md:flex flex-col items-center w-16 shrink-0 border-r border-[#E5E5EA] bg-white/60 backdrop-blur-xl py-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white shadow-sm mb-6">
          <Factory className="w-5 h-5" />
        </div>
        <nav className="flex flex-col gap-2">
          <NavLink to="/" end className={navClass} title="Csővezeték">
            <LayoutDashboard className="w-5 h-5" />
          </NavLink>
          <NavLink to="/naptar" className={navClass} title="Naptár">
            <Calendar className="w-5 h-5" />
          </NavLink>
          <NavLink to="/dashboard" className={navClass} title="Áttekintés">
            <BarChart3 className="w-5 h-5" />
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}