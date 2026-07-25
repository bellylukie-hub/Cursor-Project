import Link from "next/link";
import { PageHeader } from "@/components/PageChrome";

const adminLinks = [
  { href: "/admin/users", title: "Users & roles", description: "Create users, assign roles, areas, directions, read/write/delete/export." },
  { href: "/admin/areas", title: "Areas & aliases", description: "Create areas, NB/SB tags, offloading/loading point mapping names." },
  { href: "/admin/kpi", title: "KPI setup", description: "Targets by direction, process, border, area, status, user, document type." },
  { href: "/admin/statuses", title: "Status catalog", description: "Ordered workflow statuses for NB, SB, border, Kanyaka, POD, assets." },
  { href: "/admin/document-types", title: "Document types", description: "T1, TR8, POD, Invoice, CEEC, LMC, and custom types." },
  { href: "/admin/page-builder", title: "Page builder", description: "Design user-category pages from existing fields." },
  { href: "/admin/sql-views", title: "SQL views", description: "Approved SELECT views granted to roles." },
  { href: "/admin/audit", title: "Audit logs", description: "All creates, edits, deletes with reason, uploads, exports." },
  { href: "/admin/settings", title: "System settings", description: "Backups, retention, import templates, security." },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Admin / settings"
        description="Configure users, rights, areas, KPIs, statuses, document types, page builder, and SQL report pages."
      />
      <div className="three-col">
        {adminLinks.map((item) => (
          <Link key={item.href} href={item.href} className="report-tile">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
