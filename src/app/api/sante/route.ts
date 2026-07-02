import { NextResponse } from "next/server";
import { getGeminiAdminStatus } from "@/lib/storage";

export async function GET() {
  try {
    const status = await getGeminiAdminStatus();
    return NextResponse.json({
      succes: true,
      stockage: status.stockage,
      stockage_persistant: status.stockage_persistant
    });
  } catch {
    return NextResponse.json(
      {
        succes: false,
        stockage: "temporaire",
        stockage_persistant: false
      },
      { status: 500 }
    );
  }
}
