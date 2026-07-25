import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function NbReportsPage() {
  return (
    <>
      <PageHeader
        title="NB reports"
        description="North Bound turnaround for all areas, per area, and per user. Filter by date interval and export to Excel when permitted."
      />
      <EmptyModule title="Report filters">
        Date interval · Area · User · Border · Owner · KPI status · Export Excel / PDF
      </EmptyModule>
      <SectionPanel title="Available NB report views">
        <div className="three-col">
          {["All areas", "Per area", "Per user"].map((name) => (
            <div className="report-tile" key={name}>
              <h3>{name}</h3>
              <p>NB turnaround achievement, overdue, and days in DRC.</p>
            </div>
          ))}
        </div>
      </SectionPanel>
    </>
  );
}
