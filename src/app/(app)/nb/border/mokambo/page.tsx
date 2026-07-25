import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { borderStatuses, liveTrips } from "@/lib/mock-data";

export default function MokamboBorderPage() {
  const trips = liveTrips.filter((t) => t.border === "Mokambo" && t.direction === "NB");
  return (
    <>
      <PageHeader
        title="NB Border — Mokambo"
        description="Clearance statuses with optional/required file upload. TR8/T1 target 48h · IM4 target 72h."
      />
      <SectionPanel title="Live border trucks">
        <TripTable trips={trips} emptyMessage="No Mokambo live trucks in the demo set." />
      </SectionPanel>
      <StatusChecklist title="Mokambo status catalog" items={borderStatuses.mokambo} />
    </>
  );
}
