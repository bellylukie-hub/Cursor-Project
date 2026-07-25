import { PageHeader } from "@/components/PageChrome";
import { UploadPanel } from "@/components/ModuleBlocks";

export default function GovListUploadPage() {
  return (
    <>
      <PageHeader
        title="Gov list upload"
        description="Upload Lualaba or Kanyaka Gov list and link each truck/SB trip where possible."
      />
      <UploadPanel
        title="Import Gov list"
        description="Show unmatched items after validation."
        fields={["File", "Date", "Trip list", "Truck list", "Source (Lualaba / Kanyaka)"]}
      />
    </>
  );
}
