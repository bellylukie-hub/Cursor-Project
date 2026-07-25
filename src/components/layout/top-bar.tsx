"use client";

import { Bell, Search, User } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search trips, trucks, areas..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none ring-amber-500 focus:bg-white focus:ring-2"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Alerts"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-900">Operations User</p>
            <p className="text-xs text-slate-500">Area Supervisor</p>
          </div>
        </div>
      </div>
    </header>
  );
}
