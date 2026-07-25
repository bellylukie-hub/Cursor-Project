import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="System settings"
        description="Import templates, duplicate rules, backup/retention, password policy, and session security."
      />
      <EmptyModule title="Configuration">
        Daily backups · soft-delete policy · inactivity logout · optional 2FA for admins.
      </EmptyModule>
    </>
  );
}
