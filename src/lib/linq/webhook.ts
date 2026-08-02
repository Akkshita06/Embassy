import "server-only";
import { timingSafeEqual, createHmac } from "crypto";

/* -------------------------------------------------------------------------- */
/* Linq webhook signature verification — REAL integration                     */
/* -------------------------------------------------------------------------- */
/*
 * Linq webhooks follow the Standard Webhooks spec (docs.linqapp.com,
 * "API Reference" → webhook verification section):
 *
 *   - Headers: `webhook-id`, `webhook-timestamp`, `webhook-signature`
 *   - Signed content: `{webhook-id}.{webhook-timestamp}.{raw body}`
 *   - Secret format: `whsec_<base64>` — strip the prefix, base64-decode
 *     the rest to get the raw HMAC key
 *   - `webhook-signature` is a space-separated list of `v1,<base64 sig>`
 *     candidates; a match against any one of them is valid
 *
 * This mirrors the verification snippet published at docs.linqapp.com
 * almost line for line (Node/crypto example) rather than guessing.
 */

export class LinqWebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinqWebhookVerificationError";
  }
}

function getSigningSecret(): string {
  const secret = process.env.LINQ_WEBHOOK_SECRET;
  if (!secret || !secret.trim() || secret.trim() === "whsec_replace_me") {
    throw new LinqWebhookVerificationError(
      "LINQ_WEBHOOK_SECRET is not configured — set it to the signing secret shown for this webhook endpoint in the Linq dashboard."
    );
  }
  return secret.trim();
}

/**
 * Verifies a Linq webhook request against the Standard Webhooks
 * signature scheme. `rawBody` must be the exact, unparsed request body
 * text — signing content is sensitive to any re-serialization.
 */
export function verifyLinqWebhookSignature({
  webhookId,
  webhookTimestamp,
  webhookSignature,
  rawBody,
}: {
  webhookId: string | null;
  webhookTimestamp: string | null;
  webhookSignature: string | null;
  rawBody: string;
}): boolean {
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const secret = getSigningSecret();
  const secretStr = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const key = Buffer.from(secretStr, "base64");

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected, "utf8");

  return webhookSignature
    .split(" ")
    .filter((candidate) => candidate.startsWith("v1,"))
    .some((candidate) => {
      const sig = Buffer.from(candidate.slice(3), "utf8");
      return sig.length === expectedBuf.length && timingSafeEqual(sig, expectedBuf);
    });
}

/* -------------------------------------------------------------------------- */
/* Event shape                                                                */
/* -------------------------------------------------------------------------- */

/**
 * TODO(linq-webhook-event-catalog): Linq's docs confirm `message.received`
 * carries an `imessage_app` part with the app identity, url, and layout
 * when a user sends/interacts with a card, and mention
 * `message.delivered` for the update-in-place 409 case — but the public
 * docs don't spell out a dedicated "card action" event (e.g. a tapped
 * approve/deny button inside our own web view posting back to Linq vs.
 * just to our /card endpoint directly). Modeled loosely here as a
 * generic envelope; narrow `LinqWebhookEvent["type"]` once the full
 * event catalog is available instead of guessing at names we haven't
 * seen documented.
 */
export interface LinqWebhookEvent {
  type: string;
  data?: {
    id?: string;
    chat_id?: string;
    message?: {
      id?: string;
      parts?: Array<{
        type: string;
        [key: string]: unknown;
      }>;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}