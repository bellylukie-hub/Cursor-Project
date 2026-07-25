import Link from "next/link";
import { PageHeader } from "@/components/PageChrome";
import { areas } from "@/lib/mock-data";

export default function AreasPage() {
  return (
    <>
      <PageHeader
        title="Operational areas"
        description="Trucks are auto-grouped by offloading point (NB) or loading point (SB) using admin area aliases. Users only see assigned areas unless granted more."
      />
      <div className="three-col">
        {areas.map((area) => (
          <Link key={area.slug} href={`/areas/${area.slug}`} className="area-tile">
            <h3>{area.name}</h3>
            <p className="area-meta">Direction tag: {area.direction}</p>
            <div className="area-counts">
              <span>
                <strong>{area.liveNb}</strong>
                Live NB
              </span>
              <span>
                <strong>{area.liveSb}</strong>
                Live SB
              </span>
              <span>
                <strong>{area.overdue}</strong>
                Overdue
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
