import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { StatusChecklist } from "@/components/ModuleBlocks";
import { TripTable } from "@/components/TripTable";
import { liveTrips } from "@/lib/mock-data";

export default function SbFollowingOnPage() {
  return (
    <>
      <PageHeader
        title="Following-on list"
        description="Mutaka and Kanyaka follow-on priority list. Target ≤ 2 hours."
      />
      <SectionPanel title="Priority follow-on trucks">
        <TripTable
          trips={liveTrips.filter(
            (t) => t.direction === "SB" && /Following|Mutaka|Kanyaka/i.test(t.currentStatus + t.nextAction + t.area),
          )}
        />
      </SectionPanel>
      <div className="two-col">
        <StatusChecklist title="Mutaka" items={["Added to Mutaka list", "Cleared Mutaka ≤ 2h"]} />
        <StatusChecklist title="Kanyaka follow-on" items={["Added to Kanyaka list", "Cleared Kanyaka ≤ 2h"]} />
      </div>
    </>
  );
}
