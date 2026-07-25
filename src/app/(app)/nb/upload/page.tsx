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
  "Kanyaka dates",
  "Comments 1/2/3",
  "Zambia arrival / left",
];

export default function NbUploadPage() {
  return (
    <>
      <PageHeader
        title="NB upload"
        description="Creates the NB operational base and assigns areas by matching offloading point to admin area aliases. Existing Trip + Truck combinations are rejected."
      />
      <UploadPanel
        title="Import NB sheet"
        description="Preview and validate before import. Unmatched offloading points go to Unassigned Area."
        fields={fields}
      />
    </>
  );
}
