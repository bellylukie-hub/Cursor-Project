import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { KpiBadge } from "@/components/KpiBadge";
import { priorityAlerts } from "@/lib/mock-data";

export default function AlertCenterPage() {
  return (
    <>
      <PageHeader
        title="Alert center"
        description="Orange alerts appear as priority items for the responsible user. Red alerts are overdue and escalate per admin matrix."
      />
      <SectionPanel title="Active priority alerts">
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {priorityAlerts.map((alert) => (
            <div key={alert.id} className={`alert-item alert-${alert.level}`}>
              <div className="alert-item-top">
                <KpiBadge level={alert.level} />
                <span>{alert.timeRemaining}</span>
              </div>
              <p className="alert-truck">
                {alert.truck} · {alert.trip}
              </p>
              <p>
                {alert.area} — {alert.process}
              </p>
              <p className="alert-next">Next action: {alert.nextAction}</p>
            </div>
          ))}
        </div>
      </SectionPanel>
    </>
  );
}
