import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

export default function SbLoadingPlanPage() {
  return (
    <>
      <PageHeader
        title="SB loading plan"
        description="Follow up before the truck leaves DRC border toward the NB offloading point and before the SB loading process starts."
      />
      <SectionPanel title="Loading plan queue">
        <TripTable trips={liveTrips.filter((t) => t.direction === "SB")} />
      </SectionPanel>
      <EmptyModule title="PA / clearing agent follow-up">
        Track PA sent to clearing agent, correct clearing agent name, and reception of E number for
        trucks on the way to DRC.
      </EmptyModule>
    </>
  );
}
