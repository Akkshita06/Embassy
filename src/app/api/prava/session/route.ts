import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createPravaSession,
  PravaSessionError,
  type PravaCurrency,
  type PurchaseContextEntry,
} from "@/lib/prava/session";

interface SessionRequestBody {
  userId?: unknown;

  userEmail?: unknown;

  totalAmount?: unknown;

  currency?: unknown;

  purchaseContext?: unknown;
}

function isPravaCurrency(
  value: unknown
): value is PravaCurrency {
  return (
    value === "usd" ||
    value === "eur" ||
    value === "gbp" ||
    value === "inr"
  );
}

function isPurchaseContext(
  value: unknown
): value is PurchaseContextEntry {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return false;
  }

  const context =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof context.reference_id ===
      "string" &&
    context.reference_id
      .trim()
      .length > 0 &&
    typeof context.description ===
      "string" &&
    context.description
      .trim()
      .length > 0 &&
    typeof context.amount ===
      "number" &&
    Number.isFinite(
      context.amount
    ) &&
    context.amount > 0
  );
}

export async function POST(
  req: NextRequest
) {
  let body:
    SessionRequestBody;

  try {
    body =
      await req.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Request body must be valid JSON.",
      },
      {
        status:
          400,
      }
    );
  }

  const {
    userId,
    userEmail,
    totalAmount,
    currency,
    purchaseContext,
  } = body;

  if (
    typeof userId !==
      "string" ||
    userId.trim() ===
      "" ||
    typeof userEmail !==
      "string" ||
    userEmail.trim() ===
      "" ||
    typeof totalAmount !==
      "number" ||
    !Number.isFinite(
      totalAmount
    ) ||
    totalAmount <=
      0 ||
    !isPravaCurrency(
      currency
    ) ||
    !isPurchaseContext(
      purchaseContext
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid required fields: userId, userEmail, totalAmount, currency, purchaseContext.",
      },
      {
        status:
          400,
      }
    );
  }

  try {
    const session =
      await createPravaSession(
        {
          userId:
            userId.trim(),

          userEmail:
            userEmail.trim(),

          totalAmount,

          currency,

          purchaseContext: {
            reference_id:
              purchaseContext
                .reference_id
                .trim(),

            description:
              purchaseContext
                .description
                .trim(),

            amount:
              purchaseContext
                .amount,
          },
        }
      );

    /*
     * Safe metadata logging.
     * Never log the session token.
     */
    console.log(
      "[Embassy] Prava session created:",
      {
        sessionId:
          session.session_id,

        iframeOrigin:
          new URL(
            session.iframe_url
          ).origin,

        hasSessionToken:
          Boolean(
            session.session_token
          ),

        expiresAt:
          session.expires_at ??
          null,

        orderId:
          session.order_id ??
          null,

        status:
          session.status,
      }
    );

    /*
     * Return the exact token and iframe URL
     * received from Prava.
     *
     * Do not rebuild iframeUrl.
     * Do not append the session token manually.
     */
    return NextResponse.json(
      {
        sessionId:
          session.session_id,

        sessionToken:
          session.session_token,

        iframeUrl:
          session.iframe_url,

        expiresAt:
          session.expires_at ??
          null,

        orderId:
          session.order_id ??
          null,

        status:
          session.status ??
          "created",
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    if (
      error instanceof
      PravaSessionError
    ) {
      const status =
        error.status >= 400 &&
        error.status < 600
          ? error.status
          : 500;

      return NextResponse.json(
        {
          error:
            error.message,

          detail:
            error.body ??
            null,
        },
        {
          status,
        }
      );
    }

    console.error(
      "[Embassy] Unexpected error creating Prava session:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal server error.",
      },
      {
        status:
          500,
      }
    );
  }
}