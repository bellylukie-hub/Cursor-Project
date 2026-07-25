import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { liveTrips, sbLoadingStatuses } from "@/lib/mock-data";

export default function SbLoadingPage() {
  return (
    <>
      <PageHeader
        title="SB loading process"
        description="Mine arrival through left mine. Target ≤ 48 hours. Includes Lualaba Gov list upload against SB trips."
      />
      <SectionPanel title="Live loading trucks">
        <TripTable trips={liveTrips.filter((t) => t.direction === "SB")} />
      </SectionPanel>
      <StatusChecklist title="Loading point statuses" items={sbLoadingStatuses} />
    </>
  );
}
