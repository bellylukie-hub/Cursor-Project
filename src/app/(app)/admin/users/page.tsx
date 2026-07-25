import { PageHeader, SectionPanel } from "@/components/PageChrome";

const roles = [
  "Super Admin",
  "Admin User",
  "Operations Manager",
  "Area Supervisor",
  "Border User",
  "Kanyaka User",
  "Loading / Mine User",
  "Offloading / POD User",
  "Asset Controller",
  "Runner Fee User",
  "Read Only / Management",
  "External / Limited",
];

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Users & roles"
        description="RBAC with area-based visibility, action permissions, and optional field-level restrictions."
        actions={<button type="button" className="btn-primary">Create user</button>}
      />
      <SectionPanel title="Role catalog">
        <div className="field-chips">
          {roles.map((role) => (
            <span key={role}>{role}</span>
          ))}
        </div>
        <p className="muted">
          Permissions: read_page, create_record, update_record, delete_record (reason required),
          upload_file, export_data, approve_record, configure_system, run_sql_view, view_audit_log.
        </p>
      </SectionPanel>
    </>
  );
}
