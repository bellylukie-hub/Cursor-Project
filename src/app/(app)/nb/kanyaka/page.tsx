import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

const statuses = [
  "Date truck arrived in Kanyaka",
  "Weight of truck",
  "Date truck exited",
  "Date POD received at Kanyaka",
  "Date POD uploaded",
  "Date POD sent to invoice team (driver + current SB trip + POD list)",
];

export default function NbKanyakaPage() {
  const trips = liveTrips.filter((t) => t.area === "Kanyaka" && t.direction === "NB");
  return (
    <>
      <PageHeader
        title="NB Kanyaka"
        description="Arrival, weighing, exit, and POD handover. When POD is sent to invoice team, show driver, current SB trip, and packed POD list."
      />
      <SectionPanel title="Live Kanyaka NB trucks">
        <TripTable trips={trips} />
      </SectionPanel>
      <StatusChecklist title="Kanyaka NB events" items={statuses} />
    </>
  );
}
