import { ListToolbar, PageHeader, SectionPanel } from "@/components/PageChrome";

const contacts = [
  {
    name: "Marie Kabongo",
    company: "Customs Brokerage SA",
    function: "Clearing agent",
    email: "marie@example.com",
    place: "Kasumbalesa",
    phone: "+243 800 000 001",
    whatsapp: "+243 800 000 001",
  },
  {
    name: "John Phiri",
    company: "TransAfrica Ltd",
    function: "Fleet coordinator",
    email: "john@example.com",
    place: "Kitwe",
    phone: "+260 900 000 002",
    whatsapp: "+260 900 000 002",
  },
  {
    name: "Grace Mutale",
    company: "Mine Logistics",
    function: "POD clerk",
    email: "grace@example.com",
    place: "Kolwezi",
    phone: "+243 800 000 003",
    whatsapp: "+243 800 000 003",
  },
];

export default function CommunicationMatrixPage() {
  return (
    <>
      <PageHeader
        title="Communication matrix"
        description="People, company, function, email, place of work/affectation, phone, WhatsApp, area, active status."
        actions={
          <button type="button" className="btn-primary">
            Add contact
          </button>
        }
      />
      <SectionPanel title="Contacts">
        <ListToolbar searchPlaceholder="Search name, company, function, phone…">
          <button type="button" className="btn-secondary">
            Export
          </button>
        </ListToolbar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Function</th>
                <th>Email</th>
                <th>Place of work</th>
                <th>Phone</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.email}>
                  <td>{c.name}</td>
                  <td>{c.company}</td>
                  <td>{c.function}</td>
                  <td>{c.email}</td>
                  <td>{c.place}</td>
                  <td>{c.phone}</td>
                  <td>{c.whatsapp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </>
  );
}
