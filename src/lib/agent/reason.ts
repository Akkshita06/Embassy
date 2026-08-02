import "server-only";
import OpenAI from "openai";

/**
 * Extracts structured purchase intent from free text using an LLM.
 *
 * IMPORTANT: this only extracts and structures what the requester said —
 * it never decides allow/escalate/deny. That decision stays entirely
 * inside src/lib/policy/engine.ts. Nothing returned from here should be
 * treated as, or feed into, a policy decision; it's structured input for
 * that engine, not an output of it.
 *
 * PROVIDER: Groq (OpenAI-compatible API) by default — swapped in after
 * the hackathon-provided OpenAI credits turned out to be blocked by an
 * account-level "system limitation" on OpenAI's side (confirmed with
 * both OpenAI support and the organizers). Groq uses the same `openai`
 * SDK, just with a different baseURL/key/model. If GROQ_API_KEY isn't
 * set, this falls back to OPENAI_API_KEY so the code still works for
 * anyone who does get OpenAI unblocked later — no code changes needed,
 * just env vars.
 */

export interface ExtractedIntent {
  reason: string;
  category: string;
  riskFlags: string[];
  item: string;
  merchant: string;
  budget_ceiling: number | null;
}

export class IntentExtractionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "IntentExtractionError";
    this.status = status;
  }
}

const SYSTEM_PROMPT = `You extract structured data from a free-text purchase request written by (or on behalf of) an AI agent. You do NOT approve, deny, escalate, or evaluate the request against any policy, budget, or mandate — you only structure what was said and flag genuinely notable observations. Any judgment about whether the purchase should proceed belongs to a separate system; do not attempt it.

Return ONLY a JSON object with exactly these fields:

- "reason": string — a one-sentence plain-language summary of WHY this purchase is being requested (the underlying justification/trigger — e.g. "recurring monthly restock" or "new hire onboarding" — not a restatement of the item and amount, which are already shown elsewhere).

- "category": string — a short spend category label.

- "riskFlags": string[] — ONLY include a flag if something in the text is genuinely notable. Leave this empty for ordinary, well-justified, routine requests — an empty array is the correct and expected output most of the time. Only flag things like:
  - vague or missing justification ("no clear reason given for the purchase")
  - urgency/pressure language that could indicate manipulation ("marked urgent with no explanation", "requester emphasized approve quickly")
  - a stated amount that conflicts with or is unusually vague relative to the request ("exact amount not specified in the text")
  - requests that mention bypassing approval, splitting a purchase to stay under a limit, or similar evasive framing
  - mismatched or suspicious merchant/item pairing (e.g. item described doesn't match the stated category)
  - repeated/duplicate-sounding requests implied by the text itself
  Do NOT flag routine restocking, normal onboarding, or ordinary recurring business purchases — those are NOT risks.

- "item": string — the requested item or service.
- "merchant": string — merchant/vendor if present, else "".
- "budget_ceiling": number | null — highest amount explicitly mentioned in the text itself, else null.

Output strict JSON only, no prose, no markdown fences.`;

function normalizeExtractedIntent(value: unknown): ExtractedIntent | null {
  if (!value || typeof value !== "object") return null;

  const v = value as Record<string, unknown>;

  const reason = typeof v.reason === "string" ? v.reason.trim() : null;
  const category = typeof v.category === "string" ? v.category.trim() : null;
  const item = typeof v.item === "string" ? v.item.trim() : null;
  const merchant = typeof v.merchant === "string" ? v.merchant.trim() : "";

  const riskFlags = Array.isArray(v.riskFlags)
    ? v.riskFlags.filter((f): f is string => typeof f === "string")
    : [];

  const budget_ceiling =
    typeof v.budget_ceiling === "number" && Number.isFinite(v.budget_ceiling)
      ? v.budget_ceiling
      : null;

  if (!reason || !category || !item) return null;

  return { reason, category, riskFlags, item, merchant, budget_ceiling };
}

interface ProviderConfig {
  name: string;
  apiKey: string;
  baseURL?: string;
  model: string;
  fallbackModel?: string;
}

// Groq is tried first (free tier, no card required, OpenAI-compatible API).
// Set GROQ_MODEL to override the default if you want a different Groq model.
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
const GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant";

// OpenAI kept as a secondary option in case credits get unblocked later.
const OPENAI_MODEL = "gpt-4.1-nano";
const OPENAI_FALLBACK_MODEL = "gpt-4o-mini";

function resolveProvider(): ProviderConfig {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey && !groqKey.includes("placeholder") && !groqKey.includes("replace_me")) {
    return {
      name: "Groq",
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
      model: GROQ_MODEL,
      fallbackModel: GROQ_FALLBACK_MODEL,
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey && !openaiKey.includes("placeholder") && !openaiKey.includes("replace_me")) {
    return {
      name: "OpenAI",
      apiKey: openaiKey,
      model: OPENAI_MODEL,
      fallbackModel: OPENAI_FALLBACK_MODEL,
    };
  }

  throw new IntentExtractionError(
    "No usable API key found — set GROQ_API_KEY (recommended) or OPENAI_API_KEY in .env.local.",
    500
  );
}

/**
 * Throws IntentExtractionError on any failure (missing key, network,
 * bad shape) — callers decide whether that's fatal (the /api/agent/reason
 * route) or something to degrade gracefully past (the live evaluate
 * orchestrator, which has authoritative form fields to fall back on).
 */
export async function extractIntent(intent: string): Promise<ExtractedIntent> {
  const trimmed = intent?.trim();

  if (!trimmed) {
    throw new IntentExtractionError("intent is required.", 400);
  }

  const provider = resolveProvider();

  console.log(
    `[Embassy][${provider.name}] key loaded: true prefix:`,
    provider.apiKey.slice(0, 8) + "...",
    "model:",
    provider.model
  );
  console.log(`[Embassy][${provider.name}] intent:`, trimmed);

  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });

  async function callModel(model: string) {
    return client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
    });
  }

  let raw: string | null | undefined;

  try {
    let completion;

    try {
      completion = await callModel(provider.model);
      console.log(`[Embassy][${provider.name}] request succeeded with`, provider.model);
    } catch (primaryErr: unknown) {
      const pe = primaryErr as { status?: number; code?: string; type?: string };

      // Only fall back on errors that indicate the model itself isn't
      // available to this key — never on quota/auth errors, where
      // retrying with a different model would just hide the real problem.
      const isModelAccessIssue =
        pe?.code === "model_not_found" ||
        (pe?.type === "invalid_request_error" && pe?.status === 404) ||
        (pe?.status === 400 && pe?.code === "model_decommissioned");

      if (!isModelAccessIssue || !provider.fallbackModel) {
        throw primaryErr;
      }

      console.warn(
        `[Embassy][${provider.name}] ${provider.model} unavailable for this key, falling back to ${provider.fallbackModel}`
      );
      completion = await callModel(provider.fallbackModel);
      console.log(`[Embassy][${provider.name}] request succeeded with`, provider.fallbackModel);
    }

    raw = completion.choices?.[0]?.message?.content;
  } catch (err: unknown) {
    // Verbose, structured error logging — this is what actually tells us
    // *why* the call failed (auth, rate limit, network, wrong model name,
    // etc.) instead of just "Failed to reach the provider."
    const e = err as {
      name?: string;
      message?: string;
      status?: number;
      code?: string;
      type?: string;
      headers?: unknown;
      error?: unknown;
      cause?: unknown;
    };

    console.error(`[Embassy][${provider.name}] request failed:`);
    console.error("  name:", e?.name);
    console.error("  message:", e?.message);
    console.error("  status:", e?.status);
    console.error("  code:", e?.code);
    console.error("  type:", e?.type);
    if (e?.error) console.error("  sdk error:", JSON.stringify(e.error, null, 2));
    if (e?.cause) console.error("  cause:", e.cause);

    let hint = "";
    if (e?.status === 429) {
      hint =
        provider.name === "Groq"
          ? " (429 from Groq usually means you've hit the free-tier rate limit — wait a moment and retry, or check console.groq.com/settings/limits.)"
          : " (429 from OpenAI usually means insufficient_quota — check platform.openai.com/settings/organization/billing.)";
    } else if (e?.status === 401) {
      hint = ` (401 means the ${provider.name} key itself is invalid, revoked, or malformed — regenerate it.)`;
    } else if (e?.status === 404 && e?.code === "model_not_found") {
      hint = ` (This key does not have access to the "${provider.model}" model on ${provider.name}.)`;
    }

    throw new IntentExtractionError((e?.message ?? `Failed to reach ${provider.name}.`) + hint, e?.status ?? 502);
  }

  if (!raw) {
    throw new IntentExtractionError("Model returned no content.", 502);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`[Embassy][${provider.name}] invalid JSON returned:`, raw);
    throw new IntentExtractionError("Model returned invalid JSON.", 502);
  }

  const result = normalizeExtractedIntent(parsed);

  if (!result) {
    console.error(`[Embassy][${provider.name}] unexpected JSON shape:`, parsed);
    throw new IntentExtractionError("Model output did not match expected schema.", 502);
  }

  return result;
}