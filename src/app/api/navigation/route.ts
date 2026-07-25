import { NextResponse } from "next/server";
import { mainNavigation } from "@/config/navigation";

export async function GET() {
  return NextResponse.json({ navigation: mainNavigation });
}
