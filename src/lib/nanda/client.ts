import "server-only";

/* -------------------------------------------------------------------------- */
/* ⚠️  STUB MODULE — NOT A REAL NANDA INTEGRATION                            */
/* -------------------------------------------------------------------------- */
/*
 * Same situation as src/lib/senso/merchant-context.ts: no real Nanda API
 * docs were available to build against, so nothing here — base URL,
 * request/response field names, error shape, verification semantics —
 * should be treated as a real contract. It exists so the rest of the app
 * (decision timeline, agent identity checks, UI badges) has a stable
 * shape to consume while the pipeline step is designed.
 *
 * TODO(real-nanda-integration): once real Nanda docs are available,
 * replace this module with a real client, following the pattern in
 * src/lib/prava/session.ts:
 *   - real NANDA_REGISTRY_URL base + endpoint paths
 *   - real request/response field names (don't invent — copy exactly)
 *   - a NandaRegistryError class carrying status + raw body
 *   - response normalization with graceful fallbacks
 *   - no schema guessing
 *
 * Everything returned from this module is tagged `source: "stub"` so
 * downstream code (and logs) can tell stubbed orchestration data apart
 * from a real Nanda response.
 */

const NANDA_REGISTRY_URL_FALLBACK_STUB =
  "https://registry.nanda.example/v1"; // TODO(real-nanda-integration): replace with real Nanda registry base URL

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface NandaAgentRegistration {
  nandaAgentId: string;
  name: string;
  status: "registered" | "pending";
  registeredAt: string;
  source: "nanda" | "stub";
}

export interface NandaResolvedIdentity {
  nandaAgentId: string;
  name: string;
  /**
   * Whether Nanda's registry confirms this agent's identity. This is the
   * value that should flow into Embassy's originating-agent / delegation
   * check — that check should read `verified` here, not assume `true`.
   */
  verified: boolean;
  capabilities: string[];
  registryUrl: string;
  resolvedAt: string;
  source: "nanda" | "stub";
}

export class NandaRegistryError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "NandaRegistryError";
    this.status = status;
    this.body = body;
  }
}

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

function getApiKey(): string | null {
  const key = process.env.NANDA_API_KEY;
  if (!key || !key.trim() || key.trim() === "stub_replace_me") {
    // Expected while Nanda isn't wired up to a real registry yet.
    return null;
  }
  return key.trim();
}

function getRegistryUrl(): string {
  const url = process.env.NANDA_REGISTRY_URL;
  if (url && url.trim()) return url.trim();
  return NANDA_REGISTRY_URL_FALLBACK_STUB;
}

/* -------------------------------------------------------------------------- */
/* Deterministic stub helpers                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Deterministic (not random) so the same agent name always resolves the
 * same way across reloads/demos. Carries no real signal.
 * TODO(real-nanda-integration): delete once real registry lookups exist.
 */
function hashString(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildStubNandaAgentId(name: string): string {
  const hash = hashString(name.trim().toLowerCase());
  return `nanda_stub_${hash.toString(36)}`;
}

function buildStubRegistration(name: string): NandaAgentRegistration {
  return {
    nandaAgentId: buildStubNandaAgentId(name),
    name: name.trim(),
    status: "registered",
    registeredAt: new Date().toISOString(),
    source: "stub",
  };
}

function buildStubResolvedIdentity(
  identifier: string
): NandaResolvedIdentity {
  const trimmed = identifier.trim();

  // Deterministically "verified" for most names, but keep a small,
  // stable slice unverified so the UI has something real to show for
  // the failure path too — still entirely invented data.
  const verified = hashString(trimmed.toLowerCase()) % 10 !== 0;

  return {
    nandaAgentId: buildStubNandaAgentId(trimmed),
    name: trimmed,
    verified,
    capabilities: verified ? ["purchase-request", "delegated-spend"] : [],
    registryUrl: `${getRegistryUrl()}/agents/${encodeURIComponent(
      buildStubNandaAgentId(trimmed)
    )}`,
    resolvedAt: new Date().toISOString(),
    source: "stub",
  };
}

/* -------------------------------------------------------------------------- */
/* Public functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Registers an agent with Nanda's registry, returning a nandaAgentId.
 *
 * TODO(real-nanda-integration): once docs exist, POST to
 * `${NANDA_REGISTRY_URL}/agents` with `Authorization: Bearer
 * ${NANDA_API_KEY}`, mirroring src/lib/prava/session.ts's postSession
 * error/normalization handling. Left unimplemented rather than guessing
 * at a real request/response shape.
 */
export async function registerAgent(params: {
  name: string;
  role?: string;
}): Promise<NandaAgentRegistration> {
  if (!params.name?.trim()) {
    throw new NandaRegistryError("name is required.", 400);
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    return buildStubRegistration(params.name);
  }

  console.warn(
    "[Embassy] NANDA_API_KEY is set, but no real Nanda client is implemented yet. Falling back to stub registration.",
    { registryUrl: getRegistryUrl() }
  );

  return buildStubRegistration(params.name);
}

/**
 * Resolves an agent's identity against Nanda's registry — this is what
 * should back Embassy's originating-agent / delegation check.
 *
 * TODO(real-nanda-integration): once docs exist, GET
 * `${NANDA_REGISTRY_URL}/agents/resolve?identifier=...` (or whatever the
 * real endpoint turns out to be) with `Authorization: Bearer
 * ${NANDA_API_KEY}`, parse the real response, and only fall back to the
 * stub on network/parsing failure — never silently pass off a stub as a
 * real resolution.
 */
export async function resolveAgent(
  identifier: string
): Promise<NandaResolvedIdentity> {
  if (!identifier?.trim()) {
    throw new NandaRegistryError("identifier is required.", 400);
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    return buildStubResolvedIdentity(identifier);
  }

  console.warn(
    "[Embassy] NANDA_API_KEY is set, but no real Nanda client is implemented yet. Falling back to stub resolution.",
    { registryUrl: getRegistryUrl() }
  );

  return buildStubResolvedIdentity(identifier);
}
