import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

const statuses = [
  "Date arrives at border",
  "Update clearance status",
  "Date exit to Zambia",
];

export default function SbBorderPage() {
  return (
    <>
      <PageHeader
        title="SB border exit"
        description="Arrival, clearance, and exit. Filling Date Exit to Zambia removes the truck from the live SB main page."
      />
      <SectionPanel title="Live SB border trucks">
        <TripTable trips={liveTrips.filter((t) => t.direction === "SB")} />
      </SectionPanel>
      <StatusChecklist title="Border exit events" items={statuses} />
    </>
  );
}
