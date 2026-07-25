import { PageHeader, SectionPanel } from "@/components/PageChrome";

export default function MessagesPage() {
  return (
    <>
      <PageHeader
        title="Internal messages"
        description="Official internal email with recipient selection, tagging, and links to trip, truck, car, asset, equipment, area, or user."
        actions={
          <button type="button" className="btn-primary">
            Compose
          </button>
        }
      />
      <SectionPanel title="Compose official message">
        <div className="form-grid">
          <div className="form-field">
            <label>To / tags</label>
            <input placeholder="Users, roles, or contacts…" />
          </div>
          <div className="form-field">
            <label>Link to record</label>
            <select defaultValue="">
              <option value="" disabled>
                Trip / truck / asset / area…
              </option>
              <option>Trip NB-2026-0841</option>
              <option>Truck ABC 1234 ZM</option>
              <option>Area Kolwezi</option>
            </select>
          </div>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label>Subject</label>
            <input placeholder="Subject" />
          </div>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label>Message</label>
            <textarea rows={5} placeholder="Official message body…" />
          </div>
        </div>
        <div className="page-actions" style={{ marginTop: "0.85rem" }}>
          <button type="button" className="btn-secondary">
            Attach file
          </button>
          <button type="button" className="btn-primary">
            Send
          </button>
        </div>
      </SectionPanel>
    </>
  );
}
