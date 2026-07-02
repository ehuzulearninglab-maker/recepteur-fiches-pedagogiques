import { NextResponse } from "next/server";
import { getStorageHealth } from "@/lib/storage";

export async function GET() {
  try {
    return NextResponse.json({ succes: true, ...(await getStorageHealth()) });
  } catch {
    return NextResponse.json(
      {
        succes: false,
        database_configuree: false,
        stockage: "temporaire",
        stockage_persistant: false,
        probleme: "Diagnostic indisponible."
      },
      { status: 500 }
    );
  }
}
