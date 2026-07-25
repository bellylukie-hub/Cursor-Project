import Link from "next/link";
import { KpiBadge } from "@/components/KpiBadge";
import type { DashboardStat } from "@/lib/types";

export function StatGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="stat-grid">
      {stats.map((stat) => (
        <Link key={stat.id} href={stat.href} className={`stat-tile kpi-border-${stat.kpi}`}>
          <div className="stat-tile-top">
            <span>{stat.label}</span>
            <KpiBadge level={stat.kpi} />
          </div>
          <strong className="stat-value">{stat.value}</strong>
          <p>{stat.detail}</p>
          <span className="stat-cta">View trucks →</span>
        </Link>
      ))}
    </div>
  );
}
