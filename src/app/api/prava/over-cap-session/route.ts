import { NextRequest, NextResponse } from "next/server";
import {
  createOverCapPravaSession,
  PravaSessionError,
  type PravaCurrency,
  type PurchaseContextEntry,
} from "@/lib/prava/session";

interface OverCapSessionRequestBody {
  userId?: string;
  userEmail?: string;
  totalAmount?: number;
  currency?: PravaCurrency;
  purchaseContext?: PurchaseContextEntry;
  cardEnrollmentId?: string;
}

export async function POST(req: NextRequest) {
  let body: OverCapSessionRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const {
    userId,
    userEmail,
    totalAmount,
    currency,
    purchaseContext,
    cardEnrollmentId,
  } = body;

  if (
    !userId ||
    !userEmail ||
    !totalAmount ||
    !currency ||
    !purchaseContext ||
    !cardEnrollmentId
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: userId, userEmail, totalAmount, currency, purchaseContext, cardEnrollmentId.",
      },
      { status: 400 }
    );
  }

  try {
    const session = await createOverCapPravaSession({
      userId,
      userEmail,
      totalAmount,
      currency,
      purchaseContext,
      cardEnrollmentId,
    });

    // Only pass through what the client needs — never the secret key,
    // never the raw upstream payload verbatim.
    return NextResponse.json(
      {
        sessionId: session.session_id,
        sessionToken: session.session_token,
        iframeUrl: session.iframe_url,
        expiresAt: session.expires_at ?? null,
        orderId: session.order_id ?? null,
        status: session.status ?? "created",
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof PravaSessionError) {
      const status = err.status >= 400 && err.status < 600 ? err.status : 500;
      return NextResponse.json(
        { error: err.message, detail: err.body ?? null },
        { status }
      );
    }

    console.error("Unexpected error creating Prava over-cap session:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}