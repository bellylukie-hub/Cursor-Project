import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function SqlViewsPage() {
  return (
    <>
      <PageHeader
        title="SQL views"
        description="Admin-approved SELECT queries or database views, granted to selected users/roles. No unsafe modifications."
      />
      <EmptyModule title="Saved views">
        Create view · describe purpose · grant rights · publish as a page.
      </EmptyModule>
    </>
  );
}
