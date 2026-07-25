import { ListToolbar, PageHeader, SectionPanel } from "@/components/PageChrome";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

export default function SbMainPage() {
  const trips = liveTrips.filter((t) => t.direction === "SB");
  return (
    <>
      <PageHeader
        title="SB main page"
        description="Live South Bound trucks from loading plan through border exit. Trucks leave this list when Date Exit to Zambia is filled; history stays in reports."
        actions={
          <>
            <a href="/sb/upload" className="btn-secondary">
              SB upload
            </a>
            <a href="/sb/border" className="btn-primary">
              Border exit
            </a>
          </>
        }
      />
      <SectionPanel title="Live SB worklist">
        <ListToolbar searchPlaceholder="Search trip, truck, loading point…">
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
