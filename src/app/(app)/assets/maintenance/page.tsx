import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function AssetMaintenancePage() {
  return (
    <>
      <PageHeader title="Vehicle maintenance" description="Maintenance history and guarantees." />
      <EmptyModule title="Maintenance records">
        Type of issue, price, garage, spare part picture, guarantee period.
      </EmptyModule>
    </>
  );
}
