import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { areas } from "@/lib/mock-data";

export default function AdminAreasPage() {
  return (
    <>
      <PageHeader
        title="Areas & aliases"
        description="Create areas, tag NB/SB/Both, and maintain offloading/loading point aliases used during Excel import."
        actions={<button type="button" className="btn-primary">Add area</button>}
      />
      <SectionPanel title="Configured areas">
        <div className="three-col">
          {areas.map((area) => (
            <div key={area.slug} className="area-tile">
              <h3>{area.name}</h3>
              <p className="area-meta">Tag: {area.direction}</p>
            </div>
          ))}
        </div>
      </SectionPanel>
    </>
  );
}
