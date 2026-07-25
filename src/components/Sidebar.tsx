"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { mainNav } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(() => {
    const match = mainNav.find(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(item.href + "/") ||
        item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")),
    );
    return match?.label ?? "Dashboard";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark">TTOCS</span>
            <span className="brand-sub">Truck Turnaround &amp; Operations Control</span>
          </Link>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              item.children?.some(
                (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
              );
            const isExpanded = open === item.label;

            return (
              <div key={item.label} className="nav-group">
                {item.children ? (
                  <button
                    type="button"
                    className={`nav-parent ${isActive ? "active" : ""}`}
                    onClick={() => setOpen(isExpanded ? null : item.label)}
                    aria-expanded={isExpanded}
                  >
                    <span>{item.label}</span>
                    <span className={`chevron ${isExpanded ? "open" : ""}`}>▾</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`nav-parent ${isActive ? "active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}

                {item.children && isExpanded && (
                  <ul className="nav-children">
                    {item.children.map((child) => {
                      const childActive =
                        pathname === child.href ||
                        (child.href !== item.href && pathname.startsWith(child.href + "/"));
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={childActive ? "active" : ""}
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
