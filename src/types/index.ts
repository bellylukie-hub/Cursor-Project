export type KpiLevel = "GREEN" | "ORANGE" | "RED";

export type Direction = "NB" | "SB" | "BOTH";

export type TripRecord = {
  id: string;
  tripNumber: string;
  truckReg: string;
  owner: string;
  driver: string;
  direction: Direction;
  area: string;
  currentStatus: string;
  daysInDrc: number;
  kpiLevel: KpiLevel;
  nextAction: string;
  responsibleUser: string;
};

export type CommentStructure = {
  problem: string;
  personContacted: string;
  solutionAction: string;
  expectedSolutionTime: string;
};

export type RunnerFeeInput = {
  owner: string;
  borderName: string;
  direction: "NB" | "SB";
  zamArrivalDatetime: string;
  drcExitDatetime: string;
};

export type RunnerFeeResult = RunnerFeeInput & {
  durationDays: number;
  groupLabel: string;
  rate: number;
  amount: number;
};
