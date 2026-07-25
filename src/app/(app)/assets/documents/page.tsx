import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function AssetDocumentsPage() {
  return (
    <>
      <PageHeader title="Vehicle documents" description="Document register with expiry monitoring." />
      <EmptyModule title="Document register">
        Filter by type, expiry status, and vehicle. Upload linked to car/truck reference.
      </EmptyModule>
    </>
  );
}
