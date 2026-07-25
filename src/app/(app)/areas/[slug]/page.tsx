import { ListToolbar, PageHeader, SectionPanel } from "@/components/PageChrome";
import { TripTable } from "@/components/TripTable";
import { areas, liveTrips } from "@/lib/mock-data";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function AreaDetailPage({ params }: Props) {
  const { slug } = await params;
  const area = areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const trips = liveTrips.filter((t) => {
    if (slug === "unassigned") return false;
    return (
      t.area.toLowerCase().includes(area.name.split(" / ")[0].toLowerCase()) ||
      t.area.toLowerCase() === area.name.toLowerCase()
    );
  });

  return (
    <>
      <PageHeader
        title={area.name}
        description={`Area live worklist with NB/SB tabs, area KPI, overdue list, and export. Direction tag: ${area.direction}.`}
      />
      <SectionPanel title={`${area.name} live trucks`}>
        <ListToolbar searchPlaceholder="Search in this area…">
          <button type="button" className="btn-secondary">
            NB
          </button>
          <button type="button" className="btn-secondary">
            SB
          </button>
          <button type="button" className="btn-secondary">
            Export Excel
          </button>
        </ListToolbar>
        <TripTable
          trips={trips}
          emptyMessage={
            slug === "unassigned"
              ? "Unmatched uploads appear here for admin/supervisor correction."
              : "No demo trucks currently mapped to this area."
          }
        />
      </SectionPanel>
    </>
  );
}
