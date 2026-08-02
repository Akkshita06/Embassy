import "server-only";

const PRAVA_API_BASE =
  "https://sandbox.api.prava.space/v1";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PravaCurrency =
  | "usd"
  | "eur"
  | "gbp"
  | "inr";

export interface PurchaseContextEntry {
  reference_id: string;
  description: string;
  amount: number;
}

interface PravaPurchaseContext {
  merchant_details: {
    name: string;
    url: string;
    country_code_iso2: string;
  };

  product_details: Array<{
    description: string;
    unit_price: string;
    quantity: number;
  }>;
}

export interface CreateSessionRequest {
  integration_type: "embedding";

  user_id: string;

  user_email: string;

  total_amount: string;

  currency:
    | "USD"
    | "EUR"
    | "GBP"
    | "INR";

  purchase_context:
    PravaPurchaseContext[];

  card_enrollment_id?: string;
}

export interface CreateSessionParams {
  userId: string;

  userEmail: string;

  totalAmount: number;

  currency: PravaCurrency;

  purchaseContext:
    PurchaseContextEntry;
}

export interface OverCapSessionParams
  extends CreateSessionParams {
  cardEnrollmentId: string;
}

/**
 * Keep the exact Prava response field names.
 */
export interface PravaSession {
  session_id: string;

  session_token: string;

  iframe_url: string;

  expires_at?: string;

  order_id?: string;

  status: string;

  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* Error                                                                      */
/* -------------------------------------------------------------------------- */

export class PravaSessionError
  extends Error {
  status: number;

  body?: unknown;

  constructor(
    message: string,
    status: number,
    body?: unknown
  ) {
    super(message);

    this.name =
      "PravaSessionError";

    this.status =
      status;

    this.body =
      body;
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getSecretKey(): string {
  const key =
    process.env
      .PRAVA_SECRET_KEY;

  if (!key) {
    throw new PravaSessionError(
      "PRAVA_SECRET_KEY is not configured.",
      500
    );
  }

  return key.trim();
}

function toPravaCurrency(
  currency: PravaCurrency
):
  | "USD"
  | "EUR"
  | "GBP"
  | "INR" {
  switch (currency) {
    case "usd":
      return "USD";

    case "eur":
      return "EUR";

    case "gbp":
      return "GBP";

    case "inr":
      return "INR";
  }
}

function getString(
  value: unknown
): string | undefined {
  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  return undefined;
}

function getRecord(
  value: unknown
):
  | Record<
      string,
      unknown
    >
  | undefined {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return undefined;
}

/**
 * Use a configured public app URL.
 *
 * For a real Prava integration, this should be
 * your deployed HTTPS application URL.
 *
 * Do not use embassy.app unless you own it and
 * it is registered/configured in Prava.
 */
function getMerchantUrl(): string {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_APP_URL;

  if (
    configuredUrl &&
    configuredUrl.trim()
  ) {
    try {
      const parsed =
        new URL(
          configuredUrl.trim()
        );

      return parsed.origin;
    } catch {
      throw new PravaSessionError(
        "NEXT_PUBLIC_APP_URL is not a valid URL.",
        500
      );
    }
  }

  /*
   * Local development fallback.
   *
   * If Prava rejects localhost, deploy the app
   * and set NEXT_PUBLIC_APP_URL to the deployed
   * HTTPS URL.
   */
  return "http://localhost:3000";
}

/* -------------------------------------------------------------------------- */
/* Response normalization                                                     */
/* -------------------------------------------------------------------------- */

function normalizePravaSession(
  payload: unknown
): PravaSession {
  const root =
    getRecord(payload);

  if (!root) {
    throw new PravaSessionError(
      "Prava returned an invalid session response.",
      502,
      payload
    );
  }

  const nestedData =
    getRecord(
      root.data
    );

  const source =
    nestedData ??
    root;

  const sessionId =
    getString(
      source.session_id
    ) ??
    getString(
      source.sessionId
    ) ??
    getString(
      source.id
    );

  const sessionToken =
    getString(
      source.session_token
    ) ??
    getString(
      source.sessionToken
    ) ??
    getString(
      source.token
    );

  const iframeUrl =
    getString(
      source.iframe_url
    ) ??
    getString(
      source.iframeUrl
    ) ??
    getString(
      source.url
    );

  const expiresAt =
    getString(
      source.expires_at
    ) ??
    getString(
      source.expiresAt
    );

  const orderId =
    getString(
      source.order_id
    ) ??
    getString(
      source.orderId
    );

  const status =
    getString(
      source.status
    ) ??
    "created";

  if (!sessionId) {
    throw new PravaSessionError(
      "Prava session response is missing session_id.",
      502,
      payload
    );
  }

  if (!sessionToken) {
    throw new PravaSessionError(
      "Prava session response is missing session_token.",
      502,
      payload
    );
  }

  if (!iframeUrl) {
    throw new PravaSessionError(
      "Prava session response is missing iframe_url.",
      502,
      payload
    );
  }

  let iframeOrigin:
    string;

  try {
    const parsed =
      new URL(
        iframeUrl
      );

    if (
      parsed.protocol !==
        "https:" &&
      parsed.protocol !==
        "http:"
    ) {
      throw new Error(
        "Unsupported protocol."
      );
    }

    iframeOrigin =
      parsed.origin;
  } catch {
    throw new PravaSessionError(
      "Prava returned an invalid iframe_url.",
      502,
      payload
    );
  }

  /*
   * Never log the session token.
   */
  console.log(
    "[Embassy] Prava session normalized:",
    {
      rootKeys:
        Object.keys(
          root
        ),

      sourceKeys:
        Object.keys(
          source
        ),

      hasSessionId:
        Boolean(
          sessionId
        ),

      hasSessionToken:
        Boolean(
          sessionToken
        ),

      hasIframeUrl:
        Boolean(
          iframeUrl
        ),

      iframeOrigin,

      expiresAt:
        expiresAt ??
        null,

      hasOrderId:
        Boolean(
          orderId
        ),

      status,
    }
  );

  return {
    ...source,

    session_id:
      sessionId,

    session_token:
      sessionToken,

    iframe_url:
      iframeUrl,

    ...(expiresAt
      ? {
          expires_at:
            expiresAt,
        }
      : {}),

    ...(orderId
      ? {
          order_id:
            orderId,
        }
      : {}),

    status,
  };
}

/* -------------------------------------------------------------------------- */
/* Request builder                                                            */
/* -------------------------------------------------------------------------- */

export function buildSessionRequest(
  params: CreateSessionParams
): CreateSessionRequest {
  const {
    userId,
    userEmail,
    totalAmount,
    currency,
    purchaseContext,
  } = params;

  if (
    !userId?.trim()
  ) {
    throw new PravaSessionError(
      "userId is required.",
      400
    );
  }

  if (
    !userEmail?.trim()
  ) {
    throw new PravaSessionError(
      "userEmail is required.",
      400
    );
  }

  if (
    !Number.isFinite(
      totalAmount
    ) ||
    totalAmount <= 0
  ) {
    throw new PravaSessionError(
      "totalAmount must be positive.",
      400
    );
  }

  if (
    !purchaseContext
  ) {
    throw new PravaSessionError(
      "purchaseContext is required.",
      400
    );
  }

  if (
    !purchaseContext
      .description
      ?.trim()
  ) {
    throw new PravaSessionError(
      "purchaseContext.description is required.",
      400
    );
  }

  if (
    !Number.isFinite(
      purchaseContext.amount
    ) ||
    purchaseContext.amount <= 0
  ) {
    throw new PravaSessionError(
      "purchaseContext.amount must be positive.",
      400
    );
  }

  return {
    integration_type:
      "embedding",

    user_id:
      userId.trim(),

    user_email:
      userEmail.trim(),

    total_amount:
      totalAmount.toFixed(
        2
      ),

    currency:
      toPravaCurrency(
        currency
      ),

    purchase_context: [
      {
        merchant_details: {
          name:
            "Embassy",

          url:
            getMerchantUrl(),

          country_code_iso2:
            "IN",
        },

        product_details: [
          {
            description:
              purchaseContext
                .description
                .trim(),

            unit_price:
              purchaseContext
                .amount
                .toFixed(2),

            quantity:
              1,
          },
        ],
      },
    ],
  };
}

export function buildOverCapSessionRequest(
  params: OverCapSessionParams
): CreateSessionRequest {
  if (
    !params
      .cardEnrollmentId
      ?.trim()
  ) {
    throw new PravaSessionError(
      "cardEnrollmentId is required.",
      400
    );
  }

  const base =
    buildSessionRequest(
      params
    );

  return {
    ...base,

    card_enrollment_id:
      params
        .cardEnrollmentId
        .trim(),
  };
}

/* -------------------------------------------------------------------------- */
/* API errors                                                                 */
/* -------------------------------------------------------------------------- */

function extractPravaErrorMessage(
  payload: unknown
): string | null {
  const root =
    getRecord(payload);

  if (!root) {
    return null;
  }

  if (
    typeof root.message ===
    "string"
  ) {
    return root.message;
  }

  if (
    typeof root.error ===
    "string"
  ) {
    return root.error;
  }

  const errorObject =
    getRecord(
      root.error
    );

  if (
    errorObject &&
    typeof errorObject.message ===
      "string"
  ) {
    return errorObject.message;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Create session                                                             */
/* -------------------------------------------------------------------------- */

async function postSession(
  body: CreateSessionRequest
): Promise<PravaSession> {
  const secretKey =
    getSecretKey();

  let response:
    Response;

  try {
    response =
      await fetch(
        `${PRAVA_API_BASE}/sessions`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${secretKey}`,
          },

          body:
            JSON.stringify(
              body
            ),

          cache:
            "no-store",
        }
      );
  } catch (
    error
  ) {
    throw new PravaSessionError(
      "Failed to reach Prava API.",
      502,
      error instanceof Error
        ? error.message
        : error
    );
  }

  let payload:
    unknown = null;

  try {
    payload =
      await response.json();
  } catch {
    /*
     * Non-JSON response.
     */
  }

  if (
    !response.ok
  ) {
    console.error(
      "[Embassy] Prava session creation failed:",
      {
        status:
          response.status,

        responseBody:
          payload,

        /*
         * Do not log the secret key.
         */
        requestSummary: {
          integrationType:
            body.integration_type,

          currency:
            body.currency,

          totalAmount:
            body.total_amount,

          merchantUrl:
            body
              .purchase_context[0]
              ?.merchant_details
              .url,
        },
      }
    );

    throw new PravaSessionError(
      extractPravaErrorMessage(
        payload
      ) ??
        `Prava API returned ${response.status}.`,
      response.status,
      payload
    );
  }

  return normalizePravaSession(
    payload
  );
}

/* -------------------------------------------------------------------------- */
/* Public functions                                                           */
/* -------------------------------------------------------------------------- */

export async function createPravaSession(
  params: CreateSessionParams
): Promise<PravaSession> {
  return postSession(
    buildSessionRequest(
      params
    )
  );
}

export async function createOverCapPravaSession(
  params: OverCapSessionParams
): Promise<PravaSession> {
  return postSession(
    buildOverCapSessionRequest(
      params
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Revoke session                                                             */
/* -------------------------------------------------------------------------- */

export async function revokePravaSession(
  sessionId: string
): Promise<void> {
  if (
    !sessionId?.trim()
  ) {
    throw new PravaSessionError(
      "sessionId is required.",
      400
    );
  }

  const secretKey =
    getSecretKey();

  let response:
    Response;

  try {
    response =
      await fetch(
        `${PRAVA_API_BASE}/sessions/${encodeURIComponent(
          sessionId.trim()
        )}/revoke`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${secretKey}`,
          },

          cache:
            "no-store",
        }
      );
  } catch (
    error
  ) {
    throw new PravaSessionError(
      "Failed to reach Prava API.",
      502,
      error instanceof Error
        ? error.message
        : error
    );
  }

  if (
    !response.ok
  ) {
    let payload:
      unknown = null;

    try {
      payload =
        await response.json();
    } catch {
      /*
       * Non-JSON response.
       */
    }

    throw new PravaSessionError(
      extractPravaErrorMessage(
        payload
      ) ??
        "Prava failed to revoke the session.",
      response.status,
      payload
    );
  }
}