import { PageHeader } from "@/components/PageChrome";
import { UploadPanel } from "@/components/ModuleBlocks";

export default function DrcUploadPage() {
  return (
    <>
      <PageHeader
        title="Full DRC turnaround upload"
        description="Trucks remain on the main DRC live view until SB Date Exit to Zambia is filled."
      />
      <UploadPanel
        title="Import DRC turnaround sheet"
        description="Only new Trip + Truck combinations. Existing rows fail validation."
        fields={[
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
          "Entry / Exit border",
          "Position 1/2/3",
          "Kanyaka dates",
          "Comments 1/2/3",
          "Zambia arrival / left",
        ]}
      />
    </>
  );
}
