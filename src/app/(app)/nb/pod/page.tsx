import { ListToolbar, PageHeader, SectionPanel } from "@/components/PageChrome";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

export default function NbPodPage() {
  return (
    <>
      <PageHeader
        title="POD page"
        description="Available for all areas. Tracks POD collected, uploaded, protocol signed, driver collector for SA, current SB trip, packed POD list, and invoice handover. Completing POD closes the live NB trip."
        actions={
          <button type="button" className="btn-primary">
            Record POD handover
          </button>
        }
      />
      <SectionPanel title="POD worklist">
        <ListToolbar searchPlaceholder="Search trip, truck, driver…">
          <button type="button" className="btn-secondary">
            Area filter
          </button>
          <button type="button" className="btn-secondary">
            Export Excel
          </button>
        </ListToolbar>
        <TripTable trips={liveTrips.filter((t) => t.direction === "NB")} />
      </SectionPanel>
      <SectionPanel title="POD handover fields">
        <div className="form-grid">
          {[
            "Trip number",
            "Truck",
            "Driver collected for SA",
            "Current SB trip",
            "Protocol signed / uploaded",
            "Protocol date",
            "List of PODs sent",
            "Invoice handover status",
          ].map((field) => (
            <div className="form-field" key={field}>
              <label>{field}</label>
              <input placeholder={field} />
            </div>
          ))}
        </div>
      </SectionPanel>
    </>
  );
}
