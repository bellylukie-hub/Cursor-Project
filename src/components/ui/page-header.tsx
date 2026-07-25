import Link from "next/link";
import { getBreadcrumbs } from "@/config/navigation";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  href: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, href, actions }: PageHeaderProps) {
  const breadcrumbs = getBreadcrumbs(href);

  return (
    <div className="mb-6">
      <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <span>/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-slate-800">
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}

type KpiBadgeProps = {
  level: "GREEN" | "ORANGE" | "RED";
  label?: string;
};

export function KpiBadge({ level, label }: KpiBadgeProps) {
  const styles = {
    GREEN: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ORANGE: "bg-amber-100 text-amber-800 border-amber-200",
    RED: "bg-red-100 text-red-800 border-red-200",
  };

  const defaultLabels = {
    GREEN: "On Time",
    ORANGE: "Priority",
    RED: "Overdue",
  };

  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[level])}>
      {label ?? defaultLabels[level]}
    </span>
  );
}

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  level?: "GREEN" | "ORANGE" | "RED";
  href?: string;
};

export function StatCard({ title, value, subtitle, level, href }: StatCardProps) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {level && <KpiBadge level={level} />}
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

type ModuleLinkCardProps = {
  title: string;
  description?: string;
  href: string;
};

export function ModuleLinkCard({ title, description, href }: ModuleLinkCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </Link>
  );
}

type PlaceholderTableProps = {
  columns: string[];
  emptyMessage?: string;
};

export function PlaceholderTable({ columns, emptyMessage = "No records yet — connect database and import daily uploads." }: PlaceholderTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-medium text-slate-700">Live worklist</p>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Filter
          </button>
          <button type="button" className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
            Export Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type WorkflowStepProps = {
  steps: string[];
  currentIndex?: number;
};

export function WorkflowSteps({ steps, currentIndex = 0 }: WorkflowStepProps) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <li
          key={step}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            index === currentIndex
              ? "bg-amber-100 text-amber-900"
              : index < currentIndex
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
          )}
        >
          {index + 1}. {step}
        </li>
      ))}
    </ol>
  );
}
