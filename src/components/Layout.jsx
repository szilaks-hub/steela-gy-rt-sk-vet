import React from "react";
import { Outlet } from "react-router-dom";
import { Factory, LayoutDashboard, Bell, Settings } from "lucide-react";

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-[#F5F5F7]">
      <aside className="hidden md:flex flex-col items-center w-16 shrink-0 border-r border-[#E5E5EA] bg-white/60 backdrop-blur-xl py-5 gap-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9500] to-[#FFCC00] flex items-center justify-center text-white shadow-sm mb-5">
          <Factory className="w-5 h-5" />
        </div>
        <nav className="flex flex-col gap-1.5">
          <button className="w-10 h-10 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center" title="Gyártáskövető">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl text-[#86868B] hover:bg-black/5 flex items-center justify-center" title="Értesítések">
            <Bell className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl text-[#86868B] hover:bg-black/5 flex items-center justify-center" title="Beállítások">
            <Settings className="w-5 h-5" />
          </button>
        </nav>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}