import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { KpiBadge } from "@/components/KpiBadge";
import { liveTrips } from "@/lib/mock-data";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function TripProfilePage({ params }: Props) {
  const { id } = await params;
  const trip = liveTrips.find((t) => t.id === id);
  if (!trip) notFound();

  const tabs = [
    "Summary",
    "Timeline",
    "Documents",
    "Comments",
    "POD",
    "Border",
    "Kanyaka",
    "Loading/Offloading",
    "Audit",
  ];

  return (
    <>
      <PageHeader
        title={`${trip.tripNumber} · ${trip.truck}`}
        description="Single source of truth for one truck/trip. Every status update is timestamped with the user who performed it."
        actions={
          <>
            <button type="button" className="btn-secondary">
              Add comment
            </button>
            <button type="button" className="btn-primary">
              Update status
            </button>
          </>
        }
      />

      <SectionPanel title="Summary">
        <div className="form-grid">
          <div>
            <p className="muted">Direction / KPI</p>
            <p>
              <span className={`dir-pill dir-${trip.direction.toLowerCase()}`}>{trip.direction}</span>{" "}
              <KpiBadge level={trip.kpi} />
            </p>
          </div>
          <div>
            <p className="muted">Owner / Driver</p>
            <p>
              <strong>
                {trip.owner} · {trip.driver}
              </strong>
            </p>
          </div>
          <div>
            <p className="muted">Area / Border</p>
            <p>
              <strong>
                {trip.area} · {trip.border}
              </strong>
            </p>
          </div>
          <div>
            <p className="muted">Current status</p>
            <p>
              <strong>{trip.currentStatus}</strong>
            </p>
          </div>
          <div>
            <p className="muted">Next action</p>
            <p>
              <strong>{trip.nextAction}</strong>
            </p>
          </div>
          <div>
            <p className="muted">Responsible / Days in DRC</p>
            <p>
              <strong>
                {trip.responsibleUser} · {trip.daysInDrc} days
              </strong>
            </p>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel title="Profile tabs">
        <div className="field-chips">
          {tabs.map((tab) => (
            <span key={tab}>{tab}</span>
          ))}
        </div>
        <p className="module-placeholder">
          Comments use Problem · Person contacted · Solution / action · Expected time for solution.
          Documents link to this trip. Status history is append-only.
        </p>
      </SectionPanel>
    </>
  );
}
