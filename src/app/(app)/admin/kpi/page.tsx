import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { kpiTargets } from "@/lib/navigation";

export default function AdminKpiPage() {
  return (
    <>
      <PageHeader
        title="KPI setup"
        description="Targets by direction, process, border, area, status, user, and document type. Orange and red thresholds drive alerts."
      />
      <SectionPanel title="Default targets">
        <ul className="module-placeholder" style={{ margin: 0, paddingLeft: "1.1rem" }}>
          <li>NB full turnaround: {kpiTargets.nbFullTurnaroundDays} days</li>
          <li>Border TR8/T1: {kpiTargets.nbBorderTr8T1Hours}h · IM4: {kpiTargets.nbBorderIm4Hours}h</li>
          <li>POD: {kpiTargets.podCollectionHours}h</li>
          <li>SB loading: ≤{kpiTargets.sbLoadingHours}h · Dispatch/escort: ≤{kpiTargets.sbDispatchDays} days</li>
          <li>Following-on: ≤{kpiTargets.followingOnHours}h</li>
        </ul>
      </SectionPanel>
    </>
  );
}
