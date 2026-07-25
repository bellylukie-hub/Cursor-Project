import Link from "next/link";
import { PageHeader } from "@/components/PageChrome";

const uploads = [
  {
    href: "/uploads/drc-turnaround",
    title: "Full DRC turnaround",
    description: "General live record until SB exit to Zambia. New Trip + Truck only.",
  },
  {
    href: "/uploads/nb",
    title: "NB sheet",
    description: "Base for NB area distribution via offloading point.",
  },
  {
    href: "/uploads/sb",
    title: "SB sheet",
    description: "Base for SB area distribution via loading point.",
  },
  {
    href: "/uploads/positions",
    title: "Position update",
    description: "Update Position 1/2/3 against existing trucks (VLOOKUP style).",
  },
  {
    href: "/uploads/gov-list",
    title: "Gov list",
    description: "Lualaba or Kanyaka Gov list vs SB trips.",
  },
];

export default function UploadsIndexPage() {
  return (
    <>
      <PageHeader
        title="Daily uploads"
        description="Excel imports feed the live system. Duplicate Trip + Truck combinations are rejected with row-level errors."
      />
      <div className="three-col">
        {uploads.map((item) => (
          <Link key={item.href} href={item.href} className="report-tile">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
