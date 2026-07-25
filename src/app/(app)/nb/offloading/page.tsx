import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

const statuses = [
  "Date truck arrived at mine",
  "Date truck offloaded",
  "Date POD collected",
  "Date POD sent to Kanyaka",
  "Date POD uploaded (mine direct)",
  "Date POD sent to invoice team",
];

export default function NbOffloadingPage() {
  const trips = liveTrips.filter(
    (t) => t.direction === "NB" && /offload|mine|POD/i.test(t.currentStatus + t.nextAction),
  );
  return (
    <>
      <PageHeader
        title="NB offloading"
        description="Mine arrival, offloading, and POD collection. Direct mine POD upload opens invoice-team handover fields."
      />
      <SectionPanel title="Live offloading trucks">
        <TripTable trips={trips} />
      </SectionPanel>
      <StatusChecklist title="Offloading / POD events" items={statuses} />
    </>
  );
}
