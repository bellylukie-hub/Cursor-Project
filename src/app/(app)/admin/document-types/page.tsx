import { PageHeader, SectionPanel } from "@/components/PageChrome";

const types = [
  "T1",
  "TR8",
  "IM4",
  "POD",
  "Invoice",
  "CEEC",
  "LMC",
  "Parking Ticket",
  "Entry Card",
  "EXP1",
  "Packing List",
  "COD",
  "Police Report",
  "Insurance",
  "Other",
];

export default function AdminDocumentTypesPage() {
  return (
    <>
      <PageHeader
        title="Document types"
        description="Default and admin-created types used across trip, border, POD, asset, and equipment uploads."
        actions={<button type="button" className="btn-primary">Add document type</button>}
      />
      <SectionPanel title="Catalog">
        <div className="field-chips">
          {types.map((type) => (
            <span key={type}>{type}</span>
          ))}
        </div>
      </SectionPanel>
    </>
  );
}
