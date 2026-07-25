import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportNbPage() {
  return (
    <>
      <PageHeader title="NB turnaround report" description="All areas, per area, per user." />
      <EmptyModule title="Filters">Date interval · Area · User · Export Excel</EmptyModule>
    </>
  );
}
