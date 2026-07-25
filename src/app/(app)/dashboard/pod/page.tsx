import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

export default function PodDashboardPage() {
  const trips = liveTrips.filter(
    (t) => t.direction === "NB" && /POD|offload|Kanyaka/i.test(t.currentStatus + t.nextAction),
  );
  return (
    <>
      <PageHeader
        title="POD dashboard"
        description="POD collection, upload, and dispatch-to-invoice performance. Target: 48 hours."
      />
      <SectionPanel title="POD workflow trucks">
        <TripTable trips={trips.length ? trips : liveTrips.filter((t) => t.direction === "NB")} />
      </SectionPanel>
    </>
  );
}
