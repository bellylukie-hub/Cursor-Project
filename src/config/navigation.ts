import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  MapPin,
  Truck,
  Wrench,
  Users,
  MessageSquare,
  Calculator,
  FileBarChart,
  Settings,
  Upload,
  Bell,
  Shield,
} from "lucide-react";

export type NavItem = {
  title: string;
  href?: string;
  icon?: LucideIcon;
  description?: string;
  children?: NavItem[];
};

export const mainNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Live control tower for DRC, NB, SB, POD, and alerts",
    children: [
      { title: "Overview", href: "/dashboard" },
      { title: "NB Dashboard", href: "/dashboard/nb" },
      { title: "SB Dashboard", href: "/dashboard/sb" },
      { title: "Area Performance", href: "/dashboard/areas" },
      { title: "POD Performance", href: "/dashboard/pod" },
      { title: "Document Expiry", href: "/dashboard/documents" },
      { title: "Alert Center", href: "/dashboard/alerts" },
    ],
  },
  {
    title: "NB Operations",
    href: "/nb",
    icon: ArrowDownLeft,
    description: "North Bound: border to offloading and POD",
    children: [
      { title: "NB Main Page", href: "/nb" },
      { title: "NB Upload", href: "/nb/upload" },
      { title: "Border — Kasumbalesa", href: "/nb/border/kasumbalesa" },
      { title: "Border — Sakania", href: "/nb/border/sakania" },
      { title: "Border — Mokambo", href: "/nb/border/mokambo" },
      { title: "Kanyaka", href: "/nb/kanyaka" },
      { title: "Offloading Point", href: "/nb/offloading" },
      { title: "POD Collection", href: "/nb/pod" },
      { title: "NB Reports", href: "/nb/reports" },
    ],
  },
  {
    title: "SB Operations",
    href: "/sb",
    icon: ArrowUpRight,
    description: "South Bound: loading plan to Zambia exit",
    children: [
      { title: "SB Main Page", href: "/sb" },
      { title: "SB Upload", href: "/sb/upload" },
      { title: "Loading Plan", href: "/sb/loading-plan" },
      { title: "Loading Process", href: "/sb/loading" },
      { title: "Dispatch / Escort", href: "/sb/dispatch" },
      { title: "Following-on List", href: "/sb/following-on" },
      { title: "Kanyaka", href: "/sb/kanyaka" },
      { title: "Border", href: "/sb/border" },
      { title: "SB Reports", href: "/sb/reports" },
    ],
  },
  {
    title: "Area Pages",
    href: "/areas",
    icon: MapPin,
    description: "Trucks grouped by operational area",
    children: [
      { title: "All Areas", href: "/areas" },
      { title: "Kasumbalesa", href: "/areas/kasumbalesa" },
      { title: "Kanyaka", href: "/areas/kanyaka" },
      { title: "Lubumbashi / Kipushi", href: "/areas/lubumbashi-kipushi" },
      { title: "Likasi / Tenke", href: "/areas/likasi-tenke" },
      { title: "Kambove / Kisanfu", href: "/areas/kambove-kisanfu" },
      { title: "Kolwezi", href: "/areas/kolwezi" },
    ],
  },
  {
    title: "Imports",
    href: "/imports",
    icon: Upload,
    description: "Daily Excel uploads and position updates",
    children: [
      { title: "DRC Turnaround Upload", href: "/imports/drc-turnaround" },
      { title: "NB Sheet Upload", href: "/imports/nb" },
      { title: "SB Sheet Upload", href: "/imports/sb" },
      { title: "Position Upload", href: "/imports/positions" },
      { title: "Gov List Upload", href: "/imports/gov-list" },
    ],
  },
  {
    title: "Cars / Trucks / Assets",
    href: "/assets/vehicles",
    icon: Truck,
    description: "Vehicle register, documents, maintenance, handover",
    children: [
      { title: "Vehicle Register", href: "/assets/vehicles" },
      { title: "Document Register", href: "/assets/documents" },
      { title: "Maintenance", href: "/assets/maintenance" },
      { title: "Handover", href: "/assets/handover" },
    ],
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: Wrench,
    description: "Equipment register, assignment, maintenance, guarantees",
    children: [
      { title: "Equipment Register", href: "/equipment" },
      { title: "Assignment", href: "/equipment/assignment" },
      { title: "Maintenance", href: "/equipment/maintenance" },
      { title: "Handover", href: "/equipment/handover" },
    ],
  },
  {
    title: "Communication",
    href: "/communication",
    icon: Users,
    description: "Contacts matrix and internal messaging",
    children: [
      { title: "Communication Matrix", href: "/communication/matrix" },
      { title: "Internal Email", href: "/communication/messages" },
      { title: "Group Chat", href: "/communication/chat" },
    ],
  },
  {
    title: "Runner Fees",
    href: "/runner-fees",
    icon: Calculator,
    description: "Calculate runner fees by border, direction, and duration",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileBarChart,
    description: "Operational and management reports with Excel export",
    children: [
      { title: "All KPIs", href: "/reports/kpis" },
      { title: "NB Turnaround", href: "/reports/nb" },
      { title: "SB Turnaround", href: "/reports/sb" },
      { title: "POD Report", href: "/reports/pod" },
      { title: "Assets & Equipment", href: "/reports/assets" },
      { title: "Communication Matrix", href: "/reports/communication" },
      { title: "Runner Fees", href: "/reports/runner-fees" },
      { title: "Audit Log", href: "/reports/audit" },
    ],
  },
  {
    title: "Admin / Settings",
    href: "/admin",
    icon: Settings,
    description: "Users, roles, KPIs, areas, statuses, page builder",
    children: [
      { title: "Users", href: "/admin/users" },
      { title: "Roles & Permissions", href: "/admin/roles" },
      { title: "Areas & Aliases", href: "/admin/areas" },
      { title: "KPI Setup", href: "/admin/kpis" },
      { title: "Status Configuration", href: "/admin/statuses" },
      { title: "Document Types", href: "/admin/documents" },
      { title: "Page Builder", href: "/admin/page-builder" },
      { title: "SQL Views", href: "/admin/sql-views" },
      { title: "Audit Logs", href: "/admin/audit" },
    ],
  },
];

export const workflowModules = {
  nb: {
    stages: ["Border", "Kanyaka", "Offloading Point", "POD Collection"],
    liveRemovalRule: "POD uploaded / POD completion",
  },
  sb: {
    stages: ["Loading Plan", "Loading Process", "Dispatch / Escort", "Following-on", "Kanyaka", "Border"],
    liveRemovalRule: "Date Exit to Zambia filled",
  },
} as const;

export function findNavItemByHref(href: string): NavItem | undefined {
  for (const item of mainNavigation) {
    if (item.href === href) return item;
    for (const child of item.children ?? []) {
      if (child.href === href) return child;
    }
  }
  return undefined;
}

export function getBreadcrumbs(href: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/dashboard" }];

  for (const item of mainNavigation) {
    if (item.href === href) {
      crumbs.push({ label: item.title, href: item.href });
      return crumbs;
    }
    for (const child of item.children ?? []) {
      if (child.href === href) {
        crumbs.push({ label: item.title, href: item.href });
        crumbs.push({ label: child.title, href: child.href });
        return crumbs;
      }
    }
  }

  crumbs.push({ label: "Page" });
  return crumbs;
}
