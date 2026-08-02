import "server-only";

/* -------------------------------------------------------------------------- */
/* Real Senso integration                                                     */
/* -------------------------------------------------------------------------- */
/*
 * Replaces the old src/lib/senso/merchant-context.ts stub. That module
 * modeled a "merchant trust score" feature that does not exist in real
 * Senso — Senso is a knowledge-base + grounded-search product, not a
 * merchant-reputation service. See docs.senso.ai/docs/authentication and
 * docs.senso.ai/docs/knowledge-base for the real, documented contract
 * this file is built against.
 *
 * Real auth: `X-API-Key` header (not Bearer). Real base URL:
 * https://apiv2.senso.ai/api/v1. No OAuth, no token refresh.
 */

const DEFAULT_SENSO_API_BASE = "https://apiv2.senso.ai/api/v1";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SensoSearchResult {
  /** Raw answer text returned by Senso, grounded in ingested KB content. */
  answer: string;

  /** Source documents Senso cited, if any. Kept loose since the exact
   *  citation shape isn't nailed down in the docs snippet we have —
   *  normalized defensively below rather than assumed. */
  sources: Array<{
    title?: string;
    kb_node_id?: string;
    relevance?: number;
    [key: string]: unknown;
  }>;

  /** Full raw response, for anything not modeled above. */
  raw: unknown;
}

export class SensoApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "SensoApiError";
    this.status = status;
    this.body = body;
  }
}

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

function getApiKey(): string {
  const key = process.env.SENSO_API_KEY;
  if (!key || !key.trim()) {
    throw new SensoApiError("SENSO_API_KEY is not configured.", 500);
  }
  return key.trim();
}

function getApiBase(): string {
  const base = process.env.SENSO_API_BASE;
  return base && base.trim() ? base.trim().replace(/\/+$/, "") : DEFAULT_SENSO_API_BASE;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function extractErrorMessage(payload: unknown, status: number): string {
  const root = getRecord(payload);

  if (status === 401) return "Senso rejected the API key (401 Unauthorized).";
  if (status === 402) return "Senso: insufficient credits or spend limit reached (402).";
  if (status === 403) return "Senso: this API key doesn't have access to that content (403).";
  if (status === 404) return "Senso: resource not found (404).";

  if (root && typeof root.message === "string") return root.message;
  if (root && typeof root.error === "string") return root.error;

  return `Senso API returned ${status}.`;
}

async function sensoFetch(
  path: string,
  init: RequestInit
): Promise<unknown> {
  const apiKey = getApiKey();
  const base = getApiBase();

  let response: Response;

  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new SensoApiError(
      "Failed to reach Senso API.",
      502,
      error instanceof Error ? error.message : error
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response (e.g. some DELETE calls return no body).
  }

  if (!response.ok) {
    console.error("[Embassy] Senso API error:", {
      path,
      status: response.status,
      body: payload,
    });

    throw new SensoApiError(
      extractErrorMessage(payload, response.status),
      response.status,
      payload
    );
  }

  return payload;
}

/* -------------------------------------------------------------------------- */
/* Public functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Grounded search over the org's Senso knowledge base.
 * Real endpoint: POST /org/search  { query }
 */
export async function sensoSearch(query: string): Promise<SensoSearchResult> {
  if (!query || !query.trim()) {
    throw new SensoApiError("query is required.", 400);
  }

  const payload = await sensoFetch("/org/search", {
    method: "POST",
    body: JSON.stringify({ query: query.trim() }),
  });

  const root = getRecord(payload) ?? {};

  const answer =
    typeof root.answer === "string"
      ? root.answer
      : typeof root.response === "string"
      ? root.response
      : "";

  const sourcesRaw = Array.isArray(root.sources)
    ? root.sources
    : Array.isArray(root.results)
    ? root.results
    : [];

  return {
    answer,
    sources: sourcesRaw
      .map((s) => getRecord(s))
      .filter((s): s is Record<string, unknown> => Boolean(s)),
    raw: payload,
  };
}

/**
 * Ingest a raw text/markdown document into the knowledge base.
 * Real endpoint: POST /org/kb/raw  { kb_folder_node_id?, title, summary?, text }
 * Intended for one-off ingestion scripts (e.g. scripts/senso-ingest.ts),
 * not per-request app code.
 */
export async function ingestRawContent(params: {
  title: string;
  text: string;
  summary?: string;
  kbFolderNodeId?: string;
}): Promise<{ id: string; processing_status: string; raw: unknown }> {
  const { title, text, summary, kbFolderNodeId } = params;

  if (!title.trim()) throw new SensoApiError("title is required.", 400);
  if (!text.trim()) throw new SensoApiError("text is required.", 400);

  const payload = await sensoFetch("/org/kb/raw", {
    method: "POST",
    body: JSON.stringify({
      ...(kbFolderNodeId ? { kb_folder_node_id: kbFolderNodeId } : {}),
      title: title.trim(),
      ...(summary ? { summary } : {}),
      text,
    }),
  });

  const root = getRecord(payload) ?? {};

  return {
    id: typeof root.id === "string" ? root.id : "",
    processing_status:
      typeof root.processing_status === "string" ? root.processing_status : "unknown",
    raw: payload,
  };
}