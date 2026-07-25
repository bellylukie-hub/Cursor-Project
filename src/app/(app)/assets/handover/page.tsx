import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function AssetHandoverPage() {
  return (
    <>
      <PageHeader
        title="Vehicle handover"
        description="Issue and return vehicles with checklist and signed form upload."
      />
      <EmptyModule title="Handover log">
        Date handover, date return, user, form picture, status comment, tick checklist for condition
        in/out.
      </EmptyModule>
    </>
  );
}
