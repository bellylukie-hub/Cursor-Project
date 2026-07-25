import type { KpiLevel } from "@/lib/types";

const labels: Record<KpiLevel, string> = {
  green: "On Time",
  orange: "Priority",
  red: "Overdue",
};

const classes: Record<KpiLevel, string> = {
  green: "kpi-green",
  orange: "kpi-orange",
  red: "kpi-red",
};

export function KpiBadge({ level }: { level: KpiLevel }) {
  return (
    <span className={`kpi-badge ${classes[level]}`} title={labels[level]}>
      <span className="kpi-dot" aria-hidden />
      {labels[level]}
    </span>
  );
}
