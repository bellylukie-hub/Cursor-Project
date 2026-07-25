import { PageHeader } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function ReportCommunicationPage() {
  return (
    <>
      <PageHeader title="Communication matrix report" description="All / per area / per company / per function." />
      <EmptyModule title="Export">Filter and download contact matrix.</EmptyModule>
    </>
  );
}
