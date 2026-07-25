import { ModulePage } from "@/components/modules/module-page";

export default function Page() {
  return (
    <ModulePage
      href="/nb/upload"
      title="NB Upload"
      description="Daily NB Excel upload — Trip + Truck must be unique"
      workflow="nb"
    />
  );
}
