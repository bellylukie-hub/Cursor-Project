import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function EquipmentHandoverPage() {
  return (
    <>
      <PageHeader title="Equipment handover" description="Issue and return with checklist." />
      <EmptyModule title="Handover log">Form upload + condition checklist.</EmptyModule>
    </>
  );
}
