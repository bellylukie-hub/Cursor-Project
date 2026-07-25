import Link from "next/link";
import { PageHeader } from "@/components/PageChrome";
import { reportCatalog } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="All reports support date interval and operational filters, with Excel export when the user has export rights."
      />
      <div className="three-col">
        {reportCatalog.map((report) => (
          <Link key={report.name} href={report.href} className="report-tile">
            <h3>{report.name}</h3>
            <p>{report.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
