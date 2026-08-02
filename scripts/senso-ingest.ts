/**
 * One-off ingestion script — pushes policy documents into the Senso
 * knowledge base via the real `ingestRawContent()` client function.
 *
 * This is NOT an API route. It's meant to be run by hand (or in CI/setup)
 * whenever you want to (re)seed the KB that `sensoSearch()` later queries
 * from src/app/api/requests/evaluate/route.ts.
 *
 * Usage:
 *   npx tsx scripts/senso-ingest.ts
 *
 * Requires SENSO_API_KEY (and optionally SENSO_API_BASE) to be set —
 * this loads them from .env.local automatically via dotenv, same as the
 * rest of the app.
 *
 * -----------------------------------------------------------------------
 * These documents are written to match Embassy's own demo data in
 * src/lib/mock-data.ts (the "Office Accessories", "Software
 * Subscriptions", and "Travel & Logistics" mandates, their real
 * allow-listed merchants, and their actual daily/per-charge caps) so
 * that test purchase requests submitted through the demo UI get
 * grounded, specific answers back from Senso instead of a generic
 * fallback. They are still sample content, not a real company's actual
 * legal/finance policy — replace with your own org's real policy text
 * before using this for anything beyond a demo.
 * -----------------------------------------------------------------------
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createRequire } from "node:module";

// Plain `dotenv` only auto-loads a file literally named `.env`. This repo
// (like Next.js itself) keeps secrets in `.env.local`, so we point dotenv
// at that file explicitly rather than relying on `import "dotenv/config"`.
loadEnv({ path: path.resolve(__dirname, "../.env.local") });

/**
 * src/lib/senso/client.ts starts with `import "server-only"` — correct,
 * since it's meant to only ever run inside Next's server (API routes).
 * That guard package intentionally throws when required outside Next's
 * server-component build pipeline, which includes plain `tsx` scripts
 * like this one. Rather than weakening the guard in client.ts (which
 * would remove a real safety check for the app), we stub the module in
 * Node's require cache here, script-side only, so client.ts loads
 * normally when run standalone.
 */
const require = createRequire(import.meta.url);
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  path: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
} as NodeJS.Module;

type IngestRawContent = typeof import("../src/lib/senso/client").ingestRawContent;

async function loadIngestRawContent(): Promise<IngestRawContent> {
  const clientModule = await import("../src/lib/senso/client");
  return clientModule.ingestRawContent;
}

interface SeedDoc {
  title: string;
  summary?: string;
  text: string;
}

// ---------------------------------------------------------------------------
// SEED POLICY DOCUMENTS — matched to Embassy's demo mandates/merchants in
// src/lib/mock-data.ts. Replace with your real org policy before production use.
// ---------------------------------------------------------------------------

const SEED_DOCS: SeedDoc[] = [
  {
    title: "Office Accessories & Electronics Purchasing Policy",
    summary:
      "Spend rules for the Office Accessories mandate — Amazon, Flipkart, Croma — electronics and peripherals.",
    text: `
# Office Accessories & Electronics Purchasing Policy

Scope: purchases under the "Office Accessories" mandate, category
"Electronics & Peripherals" / "Office Accessories". Allow-listed
merchants: Amazon, Flipkart, Croma.

## Limits
- Daily cap for this mandate: ₹25,000.
- Per-charge cap: ₹12,000. Any single item above ₹12,000 (e.g. large
  monitors, docking stations, premium chairs) requires human approval
  regardless of daily budget remaining.
- Peripherals under ₹9,000 each (mice, keyboards, webcams, headsets,
  cables, small accessories) are generally low-risk and auto-approvable
  if within the remaining daily budget.

## Merchant notes
- Amazon and Flipkart are trusted, high-volume marketplaces — no
  additional review needed beyond the standard spend caps.
- Croma is trusted for in-store electronics and larger hardware
  (monitors, docking stations); items from Croma over ₹15,000 should be
  routed to IT for a hardware-need sign-off before financial approval.

## Escalation guidance
- Exceeding the ₹25,000 daily cap should escalate to the mandate
  holder rather than auto-deny — a one-off exception may be warranted
  (e.g. onboarding a new hire).
- Purchases from merchants not on the allow list (Amazon, Flipkart,
  Croma) should always be reviewed manually even if the category
  matches "Office Accessories".
`.trim(),
  },
  {
    title: "Software Subscriptions (SaaS & Tools) Policy",
    summary:
      "Spend rules for the Software Subscriptions mandate — Stripe, Vercel, OpenAI — SaaS tools, design software, and API credits.",
    text: `
# Software Subscriptions (SaaS & Tools) Policy

Scope: purchases under the "Software Subscriptions" mandate, category
"SaaS & Tools". Allow-listed merchants: Stripe, Vercel, OpenAI. Related
design/creative SaaS tools (e.g. Figma, Adobe, Canva, Notion) fall
under this same category policy even before they're individually
allow-listed, since they're the same class of recurring software spend.

## Limits
- Daily cap for this mandate: ₹15,000.
- Per-charge cap: ₹8,000. Any single subscription charge or seat
  purchase above ₹8,000 (e.g. annual team plans) should route to human
  approval rather than auto-approve.
- Per-seat SaaS purchases under ₹5,000 (e.g. a single Figma or Notion
  seat, small API credit top-ups) are generally low-risk and
  auto-approvable if within the remaining daily budget.

## Merchant notes
- Stripe, Vercel, and OpenAI are trusted infrastructure vendors — usage
  and API credit charges from these merchants need no extra review
  beyond the standard spend caps.
- Design and collaboration tools (Figma, Adobe Creative Cloud, Canva,
  Notion) should be treated the same as other "SaaS & Tools" spend:
  single-seat purchases are low-risk, team/annual plans should be
  reviewed by a human given the larger one-time cost.

## Escalation guidance
- Recurring SaaS subscriptions should be re-reviewed annually to check
  they're still in active use before renewal.
- Any request that pushes total daily spend over the ₹15,000 cap should
  escalate to the mandate holder, not auto-deny.
- Agent identities that can't be verified via Nanda should always
  escalate for SaaS purchases, even for small per-seat amounts, since
  subscriptions often auto-renew and are harder to reverse than
  one-off purchases.
`.trim(),
  },
  {
    title: "Travel & Logistics Purchasing Policy",
    summary:
      "Spend rules for the Travel & Logistics mandate — MakeMyTrip, Uber, IRCTC — flights, local transport, and rail.",
    text: `
# Travel & Logistics Purchasing Policy

Scope: purchases under the "Travel & Logistics" mandate, category
"Travel". Allow-listed merchants: MakeMyTrip, Uber, IRCTC.

## Limits
- Daily cap for this mandate: ₹40,000.
- Per-charge cap: ₹20,000. Flights and long-distance travel bookings
  above ₹20,000 (e.g. business-class fares, international travel)
  always require human approval, regardless of daily budget remaining.
- Local transport (Uber, other ride-hailing) under ₹1,000 per ride is
  low-risk and auto-approvable.

## Merchant notes
- Uber is trusted for local/client-visit transport — no additional
  review needed for typical ride amounts.
- MakeMyTrip is trusted for flight and hotel bookings, but any premium
  cabin class (business/first) or international itinerary should be
  escalated regardless of amount, since these often need advance
  approval and expense justification.
- IRCTC (rail bookings) has more limited purchase history and should
  get a light manual review for any booking over ₹2,000.

## Escalation guidance
- All travel bookings should include advance approval and receipts
  regardless of amount, per standard travel policy — routine escalation
  for anything beyond small local transport is expected behavior here,
  not a failure.
- A paused Travel & Logistics mandate means no purchases should be
  evaluated against it until a human reactivates it.
`.trim(),
  },
];

async function main() {
  const ingestRawContent = await loadIngestRawContent();

  console.log(`[senso-ingest] Ingesting ${SEED_DOCS.length} policy document(s) into Senso KB...\n`);

  let failures = 0;

  for (const doc of SEED_DOCS) {
    try {
      const result = await ingestRawContent({
        title: doc.title,
        text: doc.text,
        summary: doc.summary,
      });
      console.log(`[senso-ingest] OK  "${doc.title}"`);
      console.log(`               id=${result.id || "(none returned)"} processing_status=${result.processing_status}\n`);
    } catch (err) {
      failures += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[senso-ingest] FAILED "${doc.title}": ${message}\n`);
    }
  }

  if (failures > 0) {
    console.error(`[senso-ingest] Done with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log("[senso-ingest] Done — all documents ingested successfully.");
  }
}

main().catch((err) => {
  console.error("[senso-ingest] Unexpected fatal error:", err);
  process.exitCode = 1;
});