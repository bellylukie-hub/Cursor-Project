import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatGrid } from "@/components/StatGrid";
import { TripTable } from "@/components/TripTable";
import { dashboardStats, liveTrips } from "@/lib/mock-data";

export default function SbDashboardPage() {
  const trips = liveTrips.filter((t) => t.direction === "SB");
  return (
    <>
      <PageHeader
        title="SB dashboard"
        description="Outstanding and achieved South Bound records by KPI color."
      />
      <StatGrid stats={dashboardStats.filter((s) => ["sb", "drc-time"].includes(s.id))} />
      <SectionPanel title="SB live trucks">
        <TripTable trips={trips} />
      </SectionPanel>
    </>
  );
}
