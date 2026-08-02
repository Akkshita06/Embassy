import { NextRequest, NextResponse } from "next/server";
import { sendApprovalMessage, LinqApiError } from "@/lib/linq/client";
import { formatINR } from "@/lib/utils";

interface SendApprovalRequestBody {
  requestId?: string;
  item?: string;
  merchant?: string;
  amount?: number;
  reason?: string;
  /** Optional override — defaults to LINQ_APPROVER_PHONE. */
  approverPhone?: string;
}

export async function POST(req: NextRequest) {
  let body: SendApprovalRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { requestId, item, merchant, amount, reason } = body;

  if (!requestId || !item || !merchant || !amount) {
    return NextResponse.json(
      { error: "Missing required fields: requestId, item, merchant, amount." },
      { status: 400 }
    );
  }

  const approverPhone = body.approverPhone ?? process.env.LINQ_APPROVER_PHONE;
  if (!approverPhone || approverPhone === "+10000000000") {
    return NextResponse.json(
      {
        error:
          "No approver phone configured. Set LINQ_APPROVER_PHONE in .env.local, or pass approverPhone explicitly.",
      },
      { status: 500 }
    );
  }

  try {
    const message = await sendApprovalMessage({
      requestId,
      item,
      merchant,
      formattedAmount: formatINR(amount),
      reason: reason ?? "",
      approverPhone,
    });

    return NextResponse.json(
      {
        linqMessageId: message.id,
        linqStatus: "sent",
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof LinqApiError) {
      const status = err.status >= 400 && err.status < 600 ? err.status : 500;
      return NextResponse.json(
        { error: err.message, detail: err.body ?? null },
        { status }
      );
    }

    console.error("Unexpected error sending Linq approval message:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}