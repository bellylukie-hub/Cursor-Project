import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportAssetsPage() {
  return (
    <>
      <PageHeader
        title="Assets & equipment reports"
        description="Cars with documentation/maintenance and equipment assignment/expiry."
      />
      <EmptyModule title="Available packs">
        Cars with documentation · Cars with maintenance · All equipment
      </EmptyModule>
    </>
  );
}
