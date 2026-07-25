import Link from "next/link";
import { findNavItemByHref, mainNavigation, workflowModules } from "@/config/navigation";
import { PageHeader, ModuleLinkCard, PlaceholderTable, WorkflowSteps } from "@/components/ui/page-header";

type ModulePageProps = {
  href: string;
  title?: string;
  description?: string;
  workflow?: "nb" | "sb";
  tableColumns?: string[];
  showChildLinks?: boolean;
  extra?: React.ReactNode;
};

export function ModulePage({
  href,
  title,
  description,
  workflow,
  tableColumns = ["Trip", "Truck", "Area", "Status", "Days in DRC", "KPI", "Next Action", "Responsible"],
  showChildLinks = true,
  extra,
}: ModulePageProps) {
  const navItem = findNavItemByHref(href);
  const parent = workflow
    ? mainNavigationParent(workflow)
    : undefined;

  const childLinks = showChildLinks
    ? (parent?.children ?? navItem?.children ?? []).filter((c) => c.href && c.href !== href)
    : [];

  return (
    <div>
      <PageHeader
        href={href}
        title={title ?? navItem?.title ?? "Module"}
        description={description ?? navItem?.description}
        actions={
          <Link
            href="#"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            + Quick Action
          </Link>
        }
      />

      {workflow && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {workflow.toUpperCase()} Workflow
          </p>
          <WorkflowSteps steps={[...workflowModules[workflow].stages]} />
          <p className="mt-3 text-xs text-slate-500">
            Live removal rule: {workflowModules[workflow].liveRemovalRule}
          </p>
        </div>
      )}

      {extra}

      {childLinks.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {childLinks.map((child) => (
            <ModuleLinkCard
              key={child.href}
              title={child.title}
              description={child.description}
              href={child.href!}
            />
          ))}
        </div>
      )}

      <PlaceholderTable columns={tableColumns} />
    </div>
  );
}

function mainNavigationParent(workflow: "nb" | "sb") {
  return mainNavigation.find((item) =>
    workflow === "nb" ? item.title === "NB Operations" : item.title === "SB Operations"
  );
}
