import { PageHeader } from "@/components/PageChrome";
import { UploadPanel } from "@/components/ModuleBlocks";

export default function UploadsNbPage() {
  return (
    <>
      <PageHeader title="NB sheet upload" description="Assigns areas by offloading point aliases." />
      <UploadPanel
        title="Import NB sheet"
        description="Duplicate Trip + Truck rejected."
        fields={["Trip", "Truck", "Offloading point", "Entry border", "Positions", "Comments"]}
      />
    </>
  );
}
