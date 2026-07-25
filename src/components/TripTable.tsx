import { KpiBadge } from "@/components/KpiBadge";
import type { Trip } from "@/lib/types";

type Props = {
  trips: Trip[];
  emptyMessage?: string;
};

export function TripTable({ trips, emptyMessage = "No live trucks in this view." }: Props) {
  if (trips.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Trip</th>
            <th>Truck</th>
            <th>Direction</th>
            <th>Area</th>
            <th>Current status</th>
            <th>Next action</th>
            <th>Responsible</th>
            <th>Days in DRC</th>
            <th>KPI</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>
                <a href={`/trips/${trip.id}`} className="table-link">
                  {trip.tripNumber}
                </a>
              </td>
              <td>{trip.truck}</td>
              <td>
                <span className={`dir-pill dir-${trip.direction.toLowerCase()}`}>
                  {trip.direction}
                </span>
              </td>
              <td>{trip.area}</td>
              <td>{trip.currentStatus}</td>
              <td>{trip.nextAction}</td>
              <td>{trip.responsibleUser}</td>
              <td>{trip.daysInDrc}</td>
              <td>
                <KpiBadge level={trip.kpi} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
