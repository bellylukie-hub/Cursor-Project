import { ListToolbar, PageHeader, SectionPanel } from "@/components/PageChrome";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

export default function NbMainPage() {
  const trips = liveTrips.filter((t) => t.direction === "NB");
  return (
    <>
      <PageHeader
        title="NB main page"
        description="Live North Bound trucks from border entry through offloading and POD. Trucks leave this list when the POD completion rule is reached; history stays in reports."
        actions={
          <>
            <a href="/nb/upload" className="btn-secondary">
              NB upload
            </a>
            <a href="/nb/pod" className="btn-primary">
              POD page
            </a>
          </>
        }
      />
      <SectionPanel title="Live NB worklist">
        <ListToolbar searchPlaceholder="Search trip, truck, area…">
          <button type="button" className="btn-secondary">
            Area filter
          </button>
          <button type="button" className="btn-secondary">
            Export Excel
          </button>
        </ListToolbar>
        <TripTable trips={trips} />
      </SectionPanel>
    </>
  );
}
