import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function PageHeader({ title, description, actions }: Omit<Props, "toolbar" | "children">) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export function ListToolbar({
  searchPlaceholder = "Search…",
  children,
}: {
  searchPlaceholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="list-toolbar">
      <label className="list-search">
        <span className="sr-only">Search list</span>
        <input type="search" placeholder={searchPlaceholder} />
      </label>
      <div className="list-toolbar-actions">{children}</div>
    </div>
  );
}

export function SectionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="section-panel">
      <div className="section-panel-head">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
