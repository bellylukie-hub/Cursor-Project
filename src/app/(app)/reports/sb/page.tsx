import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportSbPage() {
  return (
    <>
      <PageHeader title="SB turnaround report" description="All areas, per area, per user." />
      <EmptyModule title="Filters">Date interval · Area · User · Export Excel</EmptyModule>
    </>
  );
}
