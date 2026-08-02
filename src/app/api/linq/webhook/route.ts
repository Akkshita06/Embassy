import { NextRequest, NextResponse } from "next/server";
import {
  verifyLinqWebhookSignature,
  LinqWebhookVerificationError,
  type LinqWebhookEvent,
} from "@/lib/linq/webhook";

/*
 * Receives real-time events from Linq (docs.linqapp.com → "Webhooks"),
 * signed per the Standard Webhooks spec. Confirmed from Linq's docs:
 *   - headers: webhook-id, webhook-timestamp, webhook-signature
 *   - signed content: `{webhook-id}.{webhook-timestamp}.{raw body}`
 *
 * TODO(linq-webhook-event-catalog): the specific event carrying an
 * approve/deny decision from a tapped imessage_app card isn't spelled
 * out in Linq's public docs beyond `message.received` (inbound
 * messages/card interactions) and `message.delivered`/`message.replied`
 * being mentioned in passing. This handler verifies the signature and
 * parses the generic envelope, then does a best-effort read of a
 * decision out of an `imessage_app` part if present. Narrow this once
 * the exact event name/payload for a card decision is confirmed against
 * a live webhook delivery or updated docs — don't guess further.
 *
 * TODO(persistence): this demo app has no database — PurchaseRequest
 * records live in the static src/lib/mock-data.ts array. A real
 * implementation would look up the request by linqMessageId, persist
 * the decision to linqStatus, and push the update to connected clients
 * (e.g. via a DB + revalidation, SSE, or websocket). For now this route
 * verifies and logs the decision so the wiring is correct end-to-end.
 */

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const webhookId = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");

  let verified: boolean;
  try {
    verified = verifyLinqWebhookSignature({
      webhookId,
      webhookTimestamp,
      webhookSignature,
      rawBody,
    });
  } catch (err) {
    if (err instanceof LinqWebhookVerificationError) {
      console.error("Linq webhook misconfigured:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    throw err;
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: LinqWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const messageId = event.data?.message?.id ?? event.data?.id;
  const imessageAppPart = event.data?.message?.parts?.find(
    (p) => p.type === "imessage_app"
  );

  console.log("[Embassy] Linq webhook received:", {
    type: event.type,
    messageId,
    hasCardPart: Boolean(imessageAppPart),
  });

  // TODO(linq-card-decision-parsing): once the real decision payload is
  // confirmed, extract approve/deny here (e.g. from the card's `url`
  // query params or a dedicated field on `imessageAppPart`), then:
  //   1. look up the PurchaseRequest by messageId (== linqMessageId)
  //   2. set linqStatus to "approved" | "denied"
  //   3. call updateApprovalCard() to redraw the card in place
  //   4. persist + notify the UI (see TODO(persistence) above)
  // Left unimplemented rather than guessed at.

  return NextResponse.json({ received: true }, { status: 200 });
}
