import type { ReactNode } from "react";

export function StatusChecklist({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section className="status-checklist">
      <h3>{title}</h3>
      <ol>
        {items.map((item, index) => (
          <li key={item}>
            <span className="status-index">{index + 1}</span>
            <span>{item}</span>
            <button type="button" className="btn-ghost">
              Update + file
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function UploadPanel({
  title,
  description,
  fields,
}: {
  title: string;
  description: string;
  fields: string[];
}) {
  return (
    <section className="upload-panel">
      <div className="section-panel-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="upload-drop">
        <p>
          Drop Excel file here, or <button type="button">browse</button>
        </p>
        <p className="muted">Only new Trip + Truck combinations are accepted. Duplicates fail with row errors.</p>
      </div>
      <div className="field-chips">
        {fields.map((field) => (
          <span key={field}>{field}</span>
        ))}
      </div>
      <div className="page-actions">
        <button type="button" className="btn-secondary">
          Download template
        </button>
        <button type="button" className="btn-primary">
          Validate &amp; import
        </button>
      </div>
    </section>
  );
}

export function EmptyModule({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="section-panel">
      <div className="section-panel-head">
        <h3>{title}</h3>
      </div>
      <div className="module-placeholder">{children}</div>
    </section>
  );
}
