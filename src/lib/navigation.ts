export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    children: [
      { label: "Overview", href: "/dashboard" },
      { label: "NB Dashboard", href: "/dashboard/nb" },
      { label: "SB Dashboard", href: "/dashboard/sb" },
      { label: "POD Dashboard", href: "/dashboard/pod" },
      { label: "Document Expiry", href: "/dashboard/document-expiry" },
      { label: "Alert Center", href: "/dashboard/alerts" },
    ],
  },
  {
    label: "NB Operations",
    href: "/nb",
    children: [
      { label: "NB Main", href: "/nb" },
      { label: "NB Upload", href: "/nb/upload" },
      { label: "Border — Kasumbalesa", href: "/nb/border/kasumbalesa" },
      { label: "Border — Sakania", href: "/nb/border/sakania" },
      { label: "Border — Mokambo", href: "/nb/border/mokambo" },
      { label: "Kanyaka", href: "/nb/kanyaka" },
      { label: "Offloading", href: "/nb/offloading" },
      { label: "POD", href: "/nb/pod" },
      { label: "NB Reports", href: "/nb/reports" },
    ],
  },
  {
    label: "SB Operations",
    href: "/sb",
    children: [
      { label: "SB Main", href: "/sb" },
      { label: "SB Upload", href: "/sb/upload" },
      { label: "Loading Plan", href: "/sb/loading-plan" },
      { label: "Loading Process", href: "/sb/loading" },
      { label: "Dispatch / Escort", href: "/sb/dispatch" },
      { label: "Following-on List", href: "/sb/following-on" },
      { label: "Kanyaka", href: "/sb/kanyaka" },
      { label: "Border Exit", href: "/sb/border" },
      { label: "SB Reports", href: "/sb/reports" },
    ],
  },
  {
    label: "Areas",
    href: "/areas",
    children: [
      { label: "All Areas", href: "/areas" },
      { label: "Kasumbalesa", href: "/areas/kasumbalesa" },
      { label: "Kanyaka", href: "/areas/kanyaka" },
      { label: "Lubumbashi / Kipushi", href: "/areas/lubumbashi-kipushi" },
      { label: "Likasi / Tenke", href: "/areas/likasi-tenke" },
      { label: "Kambove / Kisanfu", href: "/areas/kambove-kisanfu" },
      { label: "Kolwezi", href: "/areas/kolwezi" },
      { label: "Unassigned", href: "/areas/unassigned" },
    ],
  },
  {
    label: "Cars / Trucks",
    href: "/assets",
    children: [
      { label: "Vehicle Register", href: "/assets" },
      { label: "Documents", href: "/assets/documents" },
      { label: "Maintenance", href: "/assets/maintenance" },
      { label: "Handover", href: "/assets/handover" },
      { label: "Expiry Alerts", href: "/assets/expiry" },
    ],
  },
  {
    label: "Equipment",
    href: "/equipment",
    children: [
      { label: "Equipment Register", href: "/equipment" },
      { label: "Assignments", href: "/equipment/assignments" },
      { label: "Maintenance", href: "/equipment/maintenance" },
      { label: "Handover", href: "/equipment/handover" },
    ],
  },
  {
    label: "Communication",
    href: "/communication",
    children: [
      { label: "Matrix", href: "/communication" },
      { label: "Internal Messages", href: "/communication/messages" },
      { label: "Chat", href: "/communication/chat" },
    ],
  },
  {
    label: "Runner Fee",
    href: "/runner-fee",
  },
  {
    label: "Reports",
    href: "/reports",
    children: [
      { label: "All Reports", href: "/reports" },
      { label: "KPI Summary", href: "/reports/kpi" },
      { label: "NB Turnaround", href: "/reports/nb" },
      { label: "SB Turnaround", href: "/reports/sb" },
      { label: "POD", href: "/reports/pod" },
      { label: "Assets & Equipment", href: "/reports/assets" },
      { label: "Communication Matrix", href: "/reports/communication" },
      { label: "Runner Fees", href: "/reports/runner-fee" },
      { label: "Audit", href: "/reports/audit" },
    ],
  },
  {
    label: "Uploads",
    href: "/uploads",
    children: [
      { label: "DRC Turnaround", href: "/uploads/drc-turnaround" },
      { label: "NB Sheet", href: "/uploads/nb" },
      { label: "SB Sheet", href: "/uploads/sb" },
      { label: "Position Update", href: "/uploads/positions" },
      { label: "Gov List", href: "/uploads/gov-list" },
    ],
  },
  {
    label: "Admin",
    href: "/admin",
    children: [
      { label: "Users & Roles", href: "/admin/users" },
      { label: "Areas & Aliases", href: "/admin/areas" },
      { label: "KPI Setup", href: "/admin/kpi" },
      { label: "Status Catalog", href: "/admin/statuses" },
      { label: "Document Types", href: "/admin/document-types" },
      { label: "Page Builder", href: "/admin/page-builder" },
      { label: "SQL Views", href: "/admin/sql-views" },
      { label: "Audit Logs", href: "/admin/audit" },
      { label: "System Settings", href: "/admin/settings" },
    ],
  },
];

export const kpiTargets = {
  nbFullTurnaroundDays: 14,
  nbBorderTr8T1Hours: 48,
  nbBorderIm4Hours: 72,
  podCollectionHours: 48,
  sbLoadingHours: 48,
  sbDispatchDays: 8,
  followingOnHours: 2,
} as const;
