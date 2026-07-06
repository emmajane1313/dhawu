import { getAllRomEntries } from "@/app/lib/helpers/getAllRomEntries";
import { NextResponse } from "next/server";

export async function GET() {
  const entries = getAllRomEntries();
  return NextResponse.json(entries);
}
