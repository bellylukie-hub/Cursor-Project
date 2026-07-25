import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportPodPage() {
  return (
    <>
      <PageHeader
        title="POD report"
        description="Collection, upload, dispatch to invoice, protocol, driver collector, turnaround."
      />
      <EmptyModule title="Filters">Date interval · Area · User · Export Excel</EmptyModule>
    </>
  );
}
