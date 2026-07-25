import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function EquipmentMaintenancePage() {
  return (
    <>
      <PageHeader title="Equipment maintenance" description="Repair history and guarantees." />
      <EmptyModule title="Maintenance records">Linked to equipment reference.</EmptyModule>
    </>
  );
}
