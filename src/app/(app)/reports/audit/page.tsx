import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportAuditPage() {
  return (
    <>
      <PageHeader
        title="Audit report"
        description="Creates, edits, deletes (with reason), uploads, downloads, exports, status changes, and settings."
      />
      <EmptyModule title="Audit trail">Append-only logs with user, timestamp, IP, and old/new values.</EmptyModule>
    </>
  );
}
