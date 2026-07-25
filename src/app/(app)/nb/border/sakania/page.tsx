import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { borderStatuses, liveTrips } from "@/lib/mock-data";

export default function SakaniaBorderPage() {
  const trips = liveTrips.filter((t) => t.border === "Sakania" && t.direction === "NB");
  return (
    <>
      <PageHeader
        title="NB Border — Sakania"
        description="Clearance statuses with optional/required file upload. TR8/T1 target 48h · IM4 target 72h."
      />
      <SectionPanel title="Live border trucks">
        <TripTable trips={trips} />
      </SectionPanel>
      <StatusChecklist title="Sakania status catalog" items={borderStatuses.sakania} />
    </>
  );
}
