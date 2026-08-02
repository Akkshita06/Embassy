import { NextRequest, NextResponse } from "next/server";
import { revokePravaSession, PravaSessionError } from "@/lib/prava/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Session id is required." },
      { status: 400 }
    );
  }

  try {
    await revokePravaSession(id);
    return NextResponse.json({ revoked: true }, { status: 200 });
  } catch (err) {
    if (err instanceof PravaSessionError) {
      const status = err.status >= 400 && err.status < 600 ? err.status : 500;
      return NextResponse.json({ error: err.message }, { status });
    }

    console.error("Unexpected error revoking Prava session:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
