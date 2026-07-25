import { PageHeader } from "@/components/PageChrome";
import { UploadPanel } from "@/components/ModuleBlocks";

export default function PositionsUploadPage() {
  return (
    <>
      <PageHeader
        title="Position update upload"
        description="Updates Position 1, 2, and 3 on existing active records. Unmatched truck/trip goes to an exception list."
      />
      <UploadPanel
        title="Import positions"
        description="Must match existing Trip and/or Truck."
        fields={["Truck", "Trip", "Position 1", "Position 2", "Position 3", "Update date/time"]}
      />
    </>
  );
}
