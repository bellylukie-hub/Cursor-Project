import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "TTOCS API",
    version: "0.1.0",
    modules: [
      "auth", "users", "areas", "trips", "imports", "statuses",
      "documents", "dashboards", "assets", "equipment", "reports",
      "communication", "runner-fees", "admin",
    ],
  });
}
