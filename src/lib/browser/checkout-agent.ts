import "server-only";
import { Stagehand } from "@browserbasehq/stagehand";
import type { AvailableModel } from "@browserbasehq/stagehand";
import { z } from "zod";
import { getSupportedMerchant } from "./merchants";
import { logBrowserAction, type BrowserAuditEntry } from "./audit-log";

/**
 * Server-side browser-automation service (Stagehand/Browserbase).
 *
 * This module NEVER decides whether a purchase is allowed to happen —
 * that decision is made entirely upstream by
 * src/lib/policy/engine.ts + the Prava mandate check, before
 * `executeCheckout` is ever called (enforced in the caller,
 * src/app/api/agent/execute/route.ts). This module only knows how to
 * drive a browser once it has already been told "yes".
 *
 * CARD DATA BOUNDARY: this module is never given a PAN, CVV, or any
 * card field — only a masked display string (e.g. "VISA ••••4242") for
 * on-screen narration, and even that is never typed into the page. The
 * flow stops at the merchant's checkout page with the cart populated;
 * it does not attempt to submit payment. Completing payment on a
 * third-party merchant site is a distinct, out-of-scope problem (it
 * would require either a human handoff or a dedicated tokenized
 * card-present integration) and is intentionally not implemented here.
 */

export class CheckoutAgentError extends Error {
  constructor(
    message: string,
    public readonly step: string
  ) {
    super(message);
    this.name = "CheckoutAgentError";
  }
}

export interface ExecuteCheckoutParams {
  requestId: string;
  merchant: string;
  item: string;
  /** Upper bound on acceptable price for the selected item, in the mandate's currency (INR). Used only to sanity-check the match Stagehand proposes — never sent to Prava/the browser as a card limit. */
  maxAmount: number;
  /** Human-readable summary of why this session is authorized, recorded on every audit entry (e.g. "approved — Prava Mandate Check passed, card enr_demo_office"). */
  policyDecision: string;
}

export interface ExecuteCheckoutResult {
  status: "reached_checkout" | "failed" | "no_match";
  finalUrl: string | null;
  selectedItem: { title: string; price: string | null } | null;
  auditLog: BrowserAuditEntry[];
  error?: string;
}

const ProductMatchSchema = z.object({
  found: z.boolean(),
  title: z.string().nullable(),
  price: z.string().nullable(),
  reason: z.string(),
});

function getModelConfig(): { modelName: AvailableModel; clientOptions: { apiKey: string } } {
  // The browser agent needs its own LLM to plan page actions
  // (Stagehand's act/extract calls). Deliberately OpenAI-only per
  // product decision — no Groq/Anthropic fallback.
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (!openaiKey) {
    throw new CheckoutAgentError("No OpenAI API key configured for the browser agent. Set OPENAI_API_KEY.", "init");
  }

  return {
    modelName: (process.env.STAGEHAND_MODEL_NAME?.trim() || "gpt-4o-mini") as AvailableModel,
    clientOptions: { apiKey: openaiKey },
  };
}

export async function executeCheckout(params: ExecuteCheckoutParams): Promise<ExecuteCheckoutResult> {
  const { requestId, merchant, item, maxAmount, policyDecision } = params;
  const auditLog: BrowserAuditEntry[] = [];

  async function log(
    action: string,
    targetUrl: string,
    result: "success" | "failure" | "blocked",
    detail?: string
  ) {
    auditLog.push(await logBrowserAction({ requestId, action, targetUrl, policyDecision, result, detail }));
  }

  const supportedMerchant = getSupportedMerchant(merchant);
  if (!supportedMerchant) {
    await log("merchant_check", merchant, "blocked", `"${merchant}" is not in the supported-merchant allow-list.`);
    return { status: "failed", finalUrl: null, selectedItem: null, auditLog, error: "Unsupported merchant." };
  }

  const browserbaseApiKey = process.env.BROWSERBASE_API_KEY?.trim();
  const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID?.trim();
  if (!browserbaseApiKey || !browserbaseProjectId) {
    await log(
      "config_check",
      supportedMerchant.baseUrl,
      "blocked",
      "BROWSERBASE_API_KEY / BROWSERBASE_PROJECT_ID not configured."
    );
    return {
      status: "failed",
      finalUrl: null,
      selectedItem: null,
      auditLog,
      error: "Browser automation is not configured on this server.",
    };
  }

  let modelConfig: { modelName: AvailableModel; clientOptions: { apiKey: string } };
  try {
    modelConfig = getModelConfig();
  } catch (err) {
    await log("config_check", supportedMerchant.baseUrl, "blocked", (err as Error).message);
    return { status: "failed", finalUrl: null, selectedItem: null, auditLog, error: (err as Error).message };
  }

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: browserbaseApiKey,
    projectId: browserbaseProjectId,
    model: { modelName: modelConfig.modelName, ...modelConfig.clientOptions },
  });

  let finalUrl: string | null = null;
  let selectedItem: { title: string; price: string | null } | null = null;

  try {
    await stagehand.init();
    // Acquire a single top-level page for this session; act/extract
    // below are all scoped to it via { page } so navigation state is
    // shared across every step.
    const page = await stagehand.context.newPage(supportedMerchant.baseUrl);

    // 1. Open the supported merchant site.
    await log("navigate", supportedMerchant.baseUrl, "success");

    // 2. Search for the requested product.
    try {
      await stagehand.act(`search for "${item}" using the site's search bar and submit the search`, { page });
      await log("search", page.url(), "success", `Searched for "${item}".`);
    } catch (err) {
      await log("search", page.url(), "failure", (err as Error).message);
      throw new CheckoutAgentError("Search failed.", "search");
    }

    // 3. Identify a matching item on the results page. Extraction only
    // reads/reasons about page content — it never submits data.
    let match: z.infer<typeof ProductMatchSchema>;
    try {
      match = await stagehand.extract(
        `Look at the search results and find the single best match for "${item}", preferring the first clearly relevant, in-stock result priced at or below ₹${maxAmount}. Return found=false if nothing reasonably matches.`,
        ProductMatchSchema,
        { page }
      );
    } catch (err) {
      await log("identify_match", page.url(), "failure", (err as Error).message);
      throw new CheckoutAgentError("Could not evaluate search results.", "identify_match");
    }

    if (!match.found || !match.title) {
      await log("identify_match", page.url(), "failure", match.reason || "No suitable match found.");
      return {
        status: "no_match",
        finalUrl: page.url(),
        selectedItem: null,
        auditLog,
        error: "No matching product found within budget.",
      };
    }
    selectedItem = { title: match.title, price: match.price };
    await log("identify_match", page.url(), "success", `Matched "${match.title}" (${match.price ?? "price unknown"}).`);

    // 4. Select the matched item.
    try {
      await stagehand.act(`click on the search result for "${match.title}" to open its product page`, { page });
      await log("select_item", page.url(), "success", `Opened product page for "${match.title}".`);
    } catch (err) {
      await log("select_item", page.url(), "failure", (err as Error).message);
      throw new CheckoutAgentError("Could not open the matched product.", "select_item");
    }

    // 5. Add to cart.
    try {
      await stagehand.act("add this item to the cart", { page });
      await log("add_to_cart", page.url(), "success", `Added "${match.title}" to cart.`);
    } catch (err) {
      await log("add_to_cart", page.url(), "failure", (err as Error).message);
      throw new CheckoutAgentError("Could not add the item to the cart.", "add_to_cart");
    }

    // 6. Navigate to checkout. Deliberately stops here — no payment
    // fields are ever located, read, or filled by this agent.
    try {
      await stagehand.act("proceed to checkout / cart review, but do not submit any payment information", { page });
      finalUrl = page.url();
      await log("navigate_to_checkout", finalUrl, "success", "Reached checkout/cart review page.");
    } catch (err) {
      await log("navigate_to_checkout", page.url(), "failure", (err as Error).message);
      throw new CheckoutAgentError("Could not reach the checkout page.", "navigate_to_checkout");
    }

    return { status: "reached_checkout", finalUrl, selectedItem, auditLog };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown browser automation error.";
    return { status: "failed", finalUrl, selectedItem, auditLog, error: message };
  } finally {
    try {
      await stagehand.close();
    } catch (err) {
      console.warn("[Embassy] Error closing Stagehand session:", err);
    }
  }
}