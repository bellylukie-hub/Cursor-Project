import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatGrid } from "@/components/StatGrid";
import { TripTable } from "@/components/TripTable";
import { dashboardStats, liveTrips } from "@/lib/mock-data";

export default function NbDashboardPage() {
  const trips = liveTrips.filter((t) => t.direction === "NB");
  return (
    <>
      <PageHeader
        title="NB dashboard"
        description="Outstanding and achieved North Bound records by KPI color. Counts open the exact truck list."
      />
      <StatGrid stats={dashboardStats.filter((s) => ["nb", "pod", "drc-time"].includes(s.id))} />
      <SectionPanel title="NB live trucks">
        <TripTable trips={trips} />
      </SectionPanel>
    </>
  );
}
