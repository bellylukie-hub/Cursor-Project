import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportKpiPage() {
  return (
    <>
      <PageHeader title="KPI summary report" description="Targets, achievements, overdues, trends." />
      <EmptyModule title="Filters">Date · Direction · Area · User · Border · KPI status · Export</EmptyModule>
    </>
  );
}
