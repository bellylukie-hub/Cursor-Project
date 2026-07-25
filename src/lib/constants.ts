export const APP_NAME = "TTOCS";
export const APP_FULL_NAME = "Truck Turnaround & Operations Control System";

export const KPI_TARGETS = {
  nbFullTurnaroundDays: 14,
  nbTr8T1Hours: 48,
  nbIm4Hours: 72,
  podCollectionHours: 48,
  sbLoadingHours: 48,
  sbDispatchDays: 8,
  followingOnHours: 2,
} as const;

export const ALERT_COLORS = {
  GREEN: { label: "On Time", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ORANGE: { label: "Priority", className: "bg-amber-100 text-amber-800 border-amber-200" },
  RED: { label: "Overdue", className: "bg-red-100 text-red-800 border-red-200" },
} as const;

export const OPERATIONAL_AREAS = [
  { name: "Kasumbalesa", slug: "kasumbalesa" },
  { name: "Kanyaka", slug: "kanyaka" },
  { name: "Lubumbashi / Kipushi", slug: "lubumbashi-kipushi" },
  { name: "Likasi / Tenke", slug: "likasi-tenke" },
  { name: "Kambove / Kisanfu", slug: "kambove-kisanfu" },
  { name: "Kolwezi", slug: "kolwezi" },
] as const;

export const BORDER_POSTS = [
  { name: "Kasumbalesa", slug: "kasumbalesa", processes: ["KBP", "Whisky"] },
  { name: "Sakania", slug: "sakania" },
  { name: "Mokambo", slug: "mokambo" },
] as const;

export const DOCUMENT_TYPES = [
  "T1", "TR8", "IM4", "POD", "Invoice", "CEEC", "LMC",
  "Parking Ticket", "Entry Card", "EXP1", "Packing List",
  "COD", "Police Report", "Insurance", "Other",
] as const;

export const USER_ROLES = [
  "Super Admin",
  "Admin",
  "Operations Manager",
  "Area Supervisor",
  "Border User",
  "Kanyaka User",
  "Loading / Mine User",
  "Offloading / POD User",
  "Asset Controller",
  "Runner Fee User",
  "Read Only / Management Viewer",
  "External / Limited User",
] as const;

export const RUNNER_FEE_RULES = {
  sakaniaKasumbalesa: [
    { daysMin: 0, daysMax: 2, rate: 40, group: "Yellow" },
    { daysMin: 3, daysMax: 4, rate: 25, group: "Blue" },
    { daysMin: 5, daysMax: Infinity, rate: 15, group: "Red" },
  ],
  kanyaka: [
    { daysMin: 0, daysMax: 1, rate: 5 },
    { daysMin: 2, daysMax: Infinity, rate: 0 },
  ],
} as const;

export const TRIP_UPLOAD_FIELDS = [
  "Trip", "Truck", "Owner", "Driver", "Order Number",
  "Loading / Dispatch Date", "Phone", "Origin", "Clearing Agent",
  "Date PA Sent", "Loading Point", "Destination", "Offloading Point",
  "Entry Border", "Exit Border", "Position 1", "Position 2", "Position 3",
  "Date Arrived Kanyaka", "Date Left Kanyaka", "Comment 1", "Comment 2", "Comment 3",
  "Date Arrived Zambia", "Date Left Zambia",
] as const;
