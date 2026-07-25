import { PageHeader } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { borderStatuses, sbLoadingStatuses } from "@/lib/mock-data";

export default function AdminStatusesPage() {
  return (
    <>
      <PageHeader
        title="Status catalog"
        description="Configurable ordered statuses with mandatory fields and file-upload flags."
      />
      <div className="two-col">
        <StatusChecklist title="Sakania border" items={borderStatuses.sakania} />
        <StatusChecklist title="SB loading process" items={sbLoadingStatuses} />
      </div>
    </>
  );
}
