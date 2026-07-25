import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatGrid } from "@/components/StatGrid";
import { dashboardStats } from "@/lib/mock-data";

export default function DocumentExpiryPage() {
  return (
    <>
      <PageHeader
        title="Document expiry"
        description="Expiring and expired car and asset/equipment documents. Click a count to open the exact records."
      />
      <StatGrid stats={dashboardStats.filter((s) => ["car-docs", "equip-docs"].includes(s.id))} />
      <SectionPanel title="Expiry queue">
        <p className="module-placeholder">
          Document types tracked: Vignette, Insurance, Municipality, Pink Card, Authorization of
          Transport, equipment guarantees, and admin-created types. Each record includes Date From,
          Date To, Reference, and uploaded file.
        </p>
      </SectionPanel>
    </>
  );
}
