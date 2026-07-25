import { PageHeader } from "@/components/PageChrome";
import { UploadPanel } from "@/components/ModuleBlocks";

export default function UploadsSbPage() {
  return (
    <>
      <PageHeader title="SB sheet upload" description="Assigns areas by loading point aliases." />
      <UploadPanel
        title="Import SB sheet"
        description="Duplicate Trip + Truck rejected."
        fields={["Trip", "Truck", "Loading point", "Exit border", "Positions", "Comments"]}
      />
    </>
  );
}
