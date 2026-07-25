import { ListToolbar, PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatGrid } from "@/components/StatGrid";
import { TripTable } from "@/components/TripTable";
import { dashboardStats, liveTrips, priorityAlerts } from "@/lib/mock-data";
import { kpiTargets } from "@/lib/navigation";
import { KpiBadge } from "@/components/KpiBadge";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Control tower"
        description="General DRC time, NB/SB achievement, POD performance, and document expiry. Click a number to open the trucks behind it."
        actions={
          <>
            <button type="button" className="btn-secondary">
              Export overview
            </button>
            <a href="/dashboard/alerts" className="btn-primary">
              Alert center
            </a>
          </>
        }
      />

      <StatGrid stats={dashboardStats} />

      <div className="two-col">
        <SectionPanel
          title="Live trucks needing attention"
          description="Green = on time · Orange = priority · Red = overdue. Targets: NB border TR8/T1 48h, IM4 72h, full NB 14 days, POD 48h, SB loading ≤48h, escort ≤8 days."
        >
          <ListToolbar searchPlaceholder="Filter live trucks…">
            <button type="button" className="btn-secondary">
              Filters
            </button>
            <button type="button" className="btn-secondary">
              Export Excel
            </button>
          </ListToolbar>
          <TripTable trips={liveTrips.filter((t) => t.kpi !== "green")} />
        </SectionPanel>

        <SectionPanel
          title="KPI targets"
          description="Configurable in Admin → KPI Setup."
        >
          <ul className="module-placeholder" style={{ margin: 0, paddingLeft: "1.1rem" }}>
            <li>NB full turnaround: {kpiTargets.nbFullTurnaroundDays} days</li>
            <li>NB border TR8/T1: {kpiTargets.nbBorderTr8T1Hours}h · IM4: {kpiTargets.nbBorderIm4Hours}h</li>
            <li>POD collection: {kpiTargets.podCollectionHours}h</li>
            <li>SB loading: ≤{kpiTargets.sbLoadingHours}h · Dispatch/escort: ≤{kpiTargets.sbDispatchDays} days</li>
            <li>Following-on (Mutaka / Kanyaka): ≤{kpiTargets.followingOnHours}h</li>
          </ul>
          <div style={{ marginTop: "1rem", display: "grid", gap: "0.55rem" }}>
            {priorityAlerts.map((alert) => (
              <div key={alert.id} className={`alert-item alert-${alert.level}`}>
                <div className="alert-item-top">
                  <KpiBadge level={alert.level} />
                  <span>{alert.timeRemaining}</span>
                </div>
                <p className="alert-truck">
                  {alert.truck} · {alert.trip}
                </p>
                <p className="alert-next">Next: {alert.nextAction}</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </>
  );
}
