import { PageHeader } from "@/components/PageChrome";
import { UploadPanel } from "@/components/ModuleBlocks";

const fields = [
  "Trip",
  "Truck",
  "Owner",
  "Driver",
  "Order number",
  "Loading / Disp date",
  "Phone",
  "Origin",
  "Clearing agent",
  "Date PA sent",
  "Loading point",
  "Destination",
  "Offloading point",
  "Entry border",
  "Exit border",
  "Position 1/2/3",
  "Comments 1/2/3",
  "Kanyaka dates",
];

export default function SbUploadPage() {
  return (
    <>
      <PageHeader
        title="SB upload"
        description="Creates the SB operational base and assigns areas by matching loading point to admin area aliases. Existing Trip + Truck combinations are rejected."
      />
      <UploadPanel
        title="Import SB sheet"
        description="Preview and validate before import. Unmatched loading points go to Unassigned Area."
        fields={fields}
      />
    </>
  );
}
