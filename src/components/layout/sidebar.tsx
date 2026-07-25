"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { mainNavigation } from "@/config/navigation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">DRC Logistics</p>
        <h1 className="mt-1 text-lg font-bold">{APP_NAME}</h1>
        <p className="mt-1 text-xs text-slate-400">Operations Control</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {mainNavigation.map((item) => {
            const hasChildren = (item.children?.length ?? 0) > 0;
            const open = expanded[item.title] ?? isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.title}>
                <div className="flex items-center">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggle(item.title)}
                      className="mr-1 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      aria-label={`Toggle ${item.title}`}
                    >
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : (
                    <span className="w-6" />
                  )}
                  <Link
                    href={item.href ?? "#"}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-amber-500/15 text-amber-300"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{item.title}</span>
                  </Link>
                </div>

                {hasChildren && open && (
                  <ul className="ml-7 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                    {item.children!.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href!}
                          className={cn(
                            "block rounded-md px-2 py-1.5 text-xs transition-colors",
                            pathname === child.href
                              ? "bg-slate-800 text-amber-300"
                              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          )}
                        >
                          {child.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
