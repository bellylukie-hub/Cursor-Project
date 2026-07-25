import { PageHeader } from "@/components/PageChrome";
import { StatGrid } from "@/components/StatGrid";
import { dashboardStats } from "@/lib/mock-data";

export default function AssetExpiryPage() {
  return (
    <>
      <PageHeader title="Vehicle expiry alerts" description="Expiring and expired car documents." />
      <StatGrid stats={dashboardStats.filter((s) => s.id === "car-docs")} />
    </>
  );
}
