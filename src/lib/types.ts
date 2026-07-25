export type KpiLevel = "green" | "orange" | "red";
export type Direction = "NB" | "SB";

export type Trip = {
  id: string;
  tripNumber: string;
  truck: string;
  owner: string;
  driver: string;
  direction: Direction;
  area: string;
  border: string;
  loadingPoint: string;
  offloadingPoint: string;
  currentStatus: string;
  nextAction: string;
  responsibleUser: string;
  daysInDrc: number;
  kpi: KpiLevel;
  entryBorder?: string;
  exitBorder?: string;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: number;
  kpi: KpiLevel;
  href: string;
  detail: string;
};

export type AlertItem = {
  id: string;
  level: "orange" | "red";
  truck: string;
  trip: string;
  area: string;
  process: string;
  nextAction: string;
  timeRemaining: string;
};

export type AreaInfo = {
  slug: string;
  name: string;
  direction: "NB" | "SB" | "Both";
  liveNb: number;
  liveSb: number;
  overdue: number;
};
