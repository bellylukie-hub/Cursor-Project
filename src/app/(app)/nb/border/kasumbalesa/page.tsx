import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { borderStatuses, liveTrips } from "@/lib/mock-data";

export default function KasumbalesaBorderPage() {
  const trips = liveTrips.filter((t) => t.border === "Kasumbalesa" && t.direction === "NB");
  return (
    <>
      <PageHeader
        title="NB Border — Kasumbalesa"
        description="KBP and Whisky process statuses. Each status form supports file upload. Truck stays on the border live page until exit / document handover is complete."
      />
      <SectionPanel title="Live border trucks">
        <TripTable trips={trips} />
      </SectionPanel>
      <div className="two-col">
        <StatusChecklist title="Process under KBP" items={borderStatuses.kasumbalesa.kbp} />
        <StatusChecklist title="Process under Whisky" items={borderStatuses.kasumbalesa.whisky} />
      </div>
    </>
  );
}
