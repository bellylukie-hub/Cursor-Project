import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { runnerFeeRules } from "@/lib/mock-data";

export default function RunnerFeePage() {
  return (
    <>
      <PageHeader
        title="Runner fee calculation"
        description="Select owner, border, direction, Zambia arrival and DRC exit. Duration and fee groups calculate automatically."
      />
      <SectionPanel title="Fee input">
        <div className="form-grid">
          <div className="form-field">
            <label>Owner</label>
            <select defaultValue="">
              <option value="" disabled>
                Choose owner
              </option>
              <option>TransAfrica Ltd</option>
              <option>Copper Haul</option>
              <option>ZamCargo</option>
            </select>
          </div>
          <div className="form-field">
            <label>Border</label>
            <select defaultValue="">
              <option value="" disabled>
                Choose border
              </option>
              <option>Kasumbalesa</option>
              <option>Sakania</option>
              <option>Mokambo</option>
              <option>Kanyaka</option>
            </select>
          </div>
          <div className="form-field">
            <label>Direction</label>
            <select defaultValue="NB">
              <option>NB</option>
              <option>SB</option>
            </select>
          </div>
          <div className="form-field">
            <label>Trip / truck</label>
            <input placeholder="Optional trip reference" />
          </div>
          <div className="form-field">
            <label>Time arrived Zambia border</label>
            <input type="datetime-local" />
          </div>
          <div className="form-field">
            <label>Time exited DRC border</label>
            <input type="datetime-local" />
          </div>
        </div>
        <div className="page-actions" style={{ marginTop: "0.85rem" }}>
          <button type="button" className="btn-primary">
            Calculate fees
          </button>
          <button type="button" className="btn-secondary">
            Export report
          </button>
        </div>
      </SectionPanel>

      <SectionPanel title="Rate groups" description="Sakania/Kasumbalesa color groups and Kanyaka rules.">
        <div className="fee-groups">
          {runnerFeeRules.map((rule) => (
            <div
              key={`${rule.border}-${rule.days}`}
              className={`rule-tile fee-${rule.group.toLowerCase() === "kanyaka" ? "yellow" : rule.group.toLowerCase()}`}
            >
              <h3>
                ${rule.rate} · {rule.group}
              </h3>
              <p>
                {rule.border} — {rule.days}
              </p>
            </div>
          ))}
        </div>
      </SectionPanel>
    </>
  );
}
