import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function EquipmentPage() {
  return (
    <>
      <PageHeader
        title="Equipment register"
        description="Serial number, purchase date, assignment, maintenance, handover, and documents. Return date must be filled before issuing to another user."
        actions={
          <button type="button" className="btn-primary">
            Add equipment
          </button>
        }
      />
      <SectionPanel title="Identity">
        <div className="form-grid">
          {["Equipment name", "Serial number", "Date purchased / provided", "Comments"].map(
            (field) => (
              <div className="form-field" key={field}>
                <label>{field}</label>
                <input placeholder={field} />
              </div>
            ),
          )}
        </div>
      </SectionPanel>
      <div className="three-col">
        <EmptyModule title="Assignment">User assigned, assignment date, return date.</EmptyModule>
        <EmptyModule title="Maintenance">
          Issue, price, repair place, spare-part picture, guarantee.
        </EmptyModule>
        <EmptyModule title="Handover">Form upload and condition checklist in/out.</EmptyModule>
      </div>
    </>
  );
}
