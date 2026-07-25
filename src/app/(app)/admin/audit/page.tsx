import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Created, edited, deleted, uploaded, downloaded, exported, status changed, login attempts, failed validations, configuration changes."
      />
      <EmptyModule title="Log stream">
        Delete actions require a mandatory reason and remain traceable.
      </EmptyModule>
    </>
  );
}
