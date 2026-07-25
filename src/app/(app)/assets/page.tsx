import { PageHeader, SectionPanel } from "@/components/PageChrome";
import { EmptyModule } from "@/components/ModuleBlocks";

export default function AssetsPage() {
  return (
    <>
      <PageHeader
        title="Vehicle register"
        description="Cars and trucks: registration, chassis, make/model library with pictures, mileage, documents, maintenance, and handover."
        actions={
          <button type="button" className="btn-primary">
            Add vehicle
          </button>
        }
      />
      <SectionPanel title="Identity & mileage">
        <div className="form-grid">
          {[
            "Car registration",
            "Chassis number",
            "Make",
            "Model",
            "Year of fabrication",
            "Color",
            "Current mileage",
            "Next maintenance mileage",
          ].map((field) => (
            <div className="form-field" key={field}>
              <label>{field}</label>
              <input placeholder={field} />
            </div>
          ))}
        </div>
      </SectionPanel>
      <div className="three-col">
        <EmptyModule title="Documents">
          Vignette, Insurance, Municipality, Pink Card, Authorization of Transport + admin types.
          Date from/to, reference, picture, expiry alert.
        </EmptyModule>
        <EmptyModule title="Maintenance">
          Issue type, price, garage, spare-part picture, guarantee from/to.
        </EmptyModule>
        <EmptyModule title="Handover">
          Handover/return dates, user, form upload, condition checklist in/out. Return date required
          before reassignment.
        </EmptyModule>
      </div>
    </>
  );
}
