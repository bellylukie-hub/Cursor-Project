import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

const statuses = [
  "Date arrived at Kanyaka",
  "Border chosen for exit",
  "Date left Kanyaka",
  "DRHKAT list ready",
  "Scanner receipt upload",
  "Parking receipt upload",
  "Gov list upload for Kanyaka",
];

export default function SbKanyakaPage() {
  return (
    <>
      <PageHeader
        title="SB Kanyaka"
        description="Arrival, exit border choice, DRHKAT / Gov lists, scanner and parking receipts."
      />
      <SectionPanel title="Live SB Kanyaka trucks">
        <TripTable trips={liveTrips.filter((t) => t.direction === "SB" && t.area === "Kanyaka")} />
      </SectionPanel>
      <StatusChecklist title="Kanyaka SB events" items={statuses} />
    </>
  );
}
