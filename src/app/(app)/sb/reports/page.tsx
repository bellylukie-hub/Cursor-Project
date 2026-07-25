import { PageHeader, SectionPanel } from "@/components/PageChrome";

export default function SbReportsPage() {
  return (
    <>
      <PageHeader
        title="SB reports"
        description="South Bound turnaround for all areas, per area, and per user."
      />
      <SectionPanel title="Available SB report views">
        <div className="three-col">
          {["All areas", "Per area", "Per user"].map((name) => (
            <div className="report-tile" key={name}>
              <h3>{name}</h3>
              <p>SB achievement, overdue, loading and escort delays.</p>
            </div>
          ))}
        </div>
      </SectionPanel>
    </>
  );
}
