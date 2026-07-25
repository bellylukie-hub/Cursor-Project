import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function EquipmentAssignmentsPage() {
  return (
    <>
      <PageHeader title="Equipment assignments" description="Current holders and return status." />
      <EmptyModule title="Assignment board">
        Cannot reassign until previous return date is completed.
      </EmptyModule>
    </>
  );
}
