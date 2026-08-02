import "server-only";
import https from "node:https";
import dns from "node:dns";

// Prefer IPv4 first on Windows/networks where Node's default
// address selection can cause connection timeouts.
dns.setDefaultResultOrder("ipv4first");

/* -------------------------------------------------------------------------- */
/* Linq Partner API client                                                    */
/* -------------------------------------------------------------------------- */

const LINQ_API_BASE = "https://api.linqapp.com/api/partner/v3";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LinqTextPart {
  type: "text";
  value: string;
}

interface LinqCreateChatRequest {
  from: string;
  to: string[];
  message: {
    parts: LinqTextPart[];
  };
}

export interface LinqSentMessage {
  id: string;
  created_at?: string;
  delivery_status?:
    | "pending"
    | "queued"
    | "sent"
    | "delivered"
    | "received"
    | "read"
    | "failed";
  [key: string]: unknown;
}

export interface LinqChat {
  id: string;
  display_name?: string;
  message: LinqSentMessage;
  [key: string]: unknown;
}

export interface SendApprovalMessageParams {
  requestId: string;
  item: string;
  merchant: string;
  formattedAmount: string;
  reason: string;
  approverPhone: string;
}

/* -------------------------------------------------------------------------- */
/* Error                                                                      */
/* -------------------------------------------------------------------------- */

export class LinqApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "LinqApiError";
    this.status = status;
    this.body = body;
  }
}

/* -------------------------------------------------------------------------- */
/* Environment configuration                                                  */
/* -------------------------------------------------------------------------- */

function getApiKey(): string {
  const key = process.env.LINQ_API_KEY?.trim();

  if (!key || key === "linq_test_replace_me") {
    throw new LinqApiError(
      "LINQ_API_KEY is not configured. Add your real Linq API token to .env.local.",
      500
    );
  }

  return key;
}

function getFromNumber(): string {
  const from = process.env.LINQ_FROM_NUMBER?.trim();

  if (!from || from === "+10000000000") {
    throw new LinqApiError(
      "LINQ_FROM_NUMBER is not configured. Add your Linq-provisioned phone number to .env.local.",
      500
    );
  }

  return from;
}

/* -------------------------------------------------------------------------- */
/* Linq HTTPS request helper                                                  */
/* -------------------------------------------------------------------------- */

interface LinqFetchInit {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

async function linqFetch<TResponse>(
  path: string,
  init: LinqFetchInit
): Promise<TResponse> {
  const apiKey = getApiKey();
  const requestUrl = new URL(`${LINQ_API_BASE}${path}`);

  const requestBody =
    typeof init.body === "string"
      ? init.body
      : init.body
        ? String(init.body)
        : "";

  return new Promise<TResponse>((resolve, reject) => {
    const request = https.request(
      {
        protocol: requestUrl.protocol,
        hostname: requestUrl.hostname,
        port: 443,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        method: init.method ?? "GET",

        // Force IPv4 because the earlier Node connection was timing out.
        family: 4,

        // Allow up to 30 seconds for the connection/response.
        timeout: 30_000,

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Content-Length": Buffer.byteLength(requestBody, "utf8"),
          ...(init.headers ?? {}),
        },
      },
      (response) => {
        let responseText = "";

        response.setEncoding("utf8");

        response.on("data", (chunk: string) => {
          responseText += chunk;
        });

        response.on("end", () => {
          let responseBody: unknown = undefined;

          if (responseText) {
            try {
              responseBody = JSON.parse(responseText);
            } catch {
              responseBody = responseText;
            }
          }

          const statusCode = response.statusCode ?? 502;

          console.log("LINQ RESPONSE STATUS:", statusCode);

          if (statusCode < 200 || statusCode >= 300) {
            console.error("LINQ RESPONSE BODY:", responseBody);

            reject(
              new LinqApiError(
                `Linq API request failed (${statusCode}).`,
                statusCode,
                responseBody
              )
            );

            return;
          }

          resolve(responseBody as TResponse);
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(
        new Error("Linq request timed out after 30 seconds.")
      );
    });

    request.on("error", (error) => {
      console.error("LINQ HTTPS ERROR:", error);

      reject(
        new LinqApiError(
          `Failed to reach Linq: ${error.message}`,
          502
        )
      );
    });

    console.log(
      "LINQ REQUEST:",
      `${init.method ?? "GET"} ${requestUrl.toString()}`
    );

    request.write(requestBody);
    request.end();
  });
}

/* -------------------------------------------------------------------------- */
/* Approval message                                                           */
/* -------------------------------------------------------------------------- */

function buildApprovalMessageText(
  params: Omit<SendApprovalMessageParams, "approverPhone">
): string {
  return [
    "Embassy approval required",
    "",
    `Purchase: ${params.item}`,
    `Merchant: ${params.merchant}`,
    `Amount: ${params.formattedAmount}`,
    `Reason: ${params.reason}`,
    "",
    "Please review this purchase in Embassy and approve or deny it.",
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function sendApprovalMessage(
  params: SendApprovalMessageParams
): Promise<LinqSentMessage> {
  const from = getFromNumber();

  const requestBody: LinqCreateChatRequest = {
    from,
    to: [params.approverPhone],
    message: {
      parts: [
        {
          type: "text",
          value: buildApprovalMessageText(params),
        },
      ],
    },
  };

  const response = await linqFetch<{ chat: LinqChat }>("/chats", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  const message = response.chat?.message;

  if (!message?.id) {
    throw new LinqApiError(
      "Linq returned a successful response, but no message ID was found.",
      502,
      response
    );
  }

  return message;
}
