import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportRunnerFeePage() {
  return (
    <>
      <PageHeader
        title="Runner fee report"
        description="Owner, border, direction, duration groups, subtotals, and grand total."
      />
      <EmptyModule title="Grouped totals">Yellow / Blue / Red groups + Kanyaka + SB grand total.</EmptyModule>
    </>
  );
}
