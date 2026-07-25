import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

export default function SbDispatchPage() {
  return (
    <>
      <PageHeader
        title="Dispatch / escort"
        description="Track escort availability and truck departure from mine. Target ≤ 8 days."
      />
      <SectionPanel title="Dispatch queue">
        <TripTable
          trips={liveTrips.filter(
            (t) => t.direction === "SB" && /dispatch|escort|seal|Loaded/i.test(t.currentStatus + t.nextAction),
          )}
        />
      </SectionPanel>
    </>
  );
}
