import { PageHeader, StatCard } from "@/components/ui/page-header";
import { KPI_TARGETS } from "@/lib/constants";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        href="/dashboard"
        title="Control Tower"
        description="Live overview of DRC turnaround, NB/SB performance, POD, document expiry, and priority alerts."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Trucks in DRC" value="—" subtitle="Click to drill down" level="ORANGE" href="/dashboard" />
        <StatCard title="NB Outstanding" value="—" subtitle={`Target: ${KPI_TARGETS.nbFullTurnaroundDays} days`} level="GREEN" href="/dashboard/nb" />
        <StatCard title="SB Outstanding" value="—" subtitle={`Loading ≤ ${KPI_TARGETS.sbLoadingHours}h`} level="GREEN" href="/dashboard/sb" />
        <StatCard title="POD Pending" value="—" subtitle={`Target: ${KPI_TARGETS.podCollectionHours}h`} level="ORANGE" href="/dashboard/pod" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatCard title="NB by Area" value="—" subtitle="Per-area achievement" href="/dashboard/areas" />
        <StatCard title="SB by Area" value="—" subtitle="Per-area achievement" href="/dashboard/areas" />
        <StatCard title="Car Document Expiry" value="—" subtitle="Expiring within KPI window" level="ORANGE" href="/dashboard/documents" />
        <StatCard title="Priority Alerts" value="3" subtitle="Orange alerts for responsible users" level="ORANGE" href="/dashboard/alerts" />
      </div>
    </div>
  );
}
