import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function PageBuilderPage() {
  return (
    <>
      <PageHeader
        title="Page builder"
        description="Design pages for each user category using existing fields. Set filters and read/write/delete/export rights."
      />
      <EmptyModule title="Builder canvas">
        Select fields, required/read-only flags, role access, and save as a user-category layout.
      </EmptyModule>
    </>
  );
}
