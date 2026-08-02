import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * Structured audit trail for every browser-automation action Stagehand
 * takes on behalf of an agent. This is intentionally separate from
 * Embassy's decisionPath (src/lib/policy/engine.ts) — decisionPath
 * records *why* a purchase was allowed to proceed; this module records
 * *what the browser actually did* once it was allowed to.
 *
 * No database in this app (see src/app/api/requests/evaluate/route.ts),
 * so entries are:
 *   1. appended to a local JSON-lines file (logs/browser-audit.log) —
 *      durable across the request/response, inspectable outside the UI.
 *   2. returned in the API response so the caller can mirror them into
 *      the existing ActivityTimeline UI without a separate fetch/poll.
 */

export type BrowserActionResult = "success" | "failure" | "blocked";

export interface BrowserAuditEntry {
  /** ISO-8601 timestamp of when this action was recorded. */
  timestamp: string;
  /** The PurchaseRequest this action belongs to. */
  requestId: string;
  /** Short machine-readable action name, e.g. "navigate", "add_to_cart". */
  action: string;
  /** The URL the browser was acting against when this action ran. */
  targetUrl: string;
  /**
   * The policy decision that authorized this browser session to run at
   * all (e.g. "approved — Prava Mandate Check passed"). Recorded on
   * every entry, not just the first, so a partial log file (or a single
   * entry someone is inspecting in isolation) is still self-explanatory
   * about why the browser was allowed to be here.
   */
  policyDecision: string;
  /** Outcome of this specific action. */
  result: BrowserActionResult;
  /** Optional extra detail (error message, matched product title, etc). */
  detail?: string;
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "browser-audit.log");

async function ensureLogDir(): Promise<void> {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

/**
 * Appends a single structured entry to the audit log file as a JSON
 * line. Best-effort: a logging failure must never take down the
 * browser action it's trying to record, so failures are caught and
 * warned rather than thrown.
 */
export async function recordAuditEntry(entry: BrowserAuditEntry): Promise<void> {
  try {
    await ensureLogDir();
    await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.warn("[Embassy] Failed to persist browser audit entry (continuing):", err);
  }
  // Structured console line too, so it shows up in server logs/observability
  // tooling without needing to tail the file.
  console.log("[Embassy][browser-audit]", JSON.stringify(entry));
}

/**
 * Convenience helper: builds + records an entry in one call, and
 * returns it so the caller can also push it onto the in-request list
 * that gets returned to the client for the UI timeline.
 */
export async function logBrowserAction(params: {
  requestId: string;
  action: string;
  targetUrl: string;
  policyDecision: string;
  result: BrowserActionResult;
  detail?: string;
}): Promise<BrowserAuditEntry> {
  const entry: BrowserAuditEntry = {
    timestamp: new Date().toISOString(),
    ...params,
  };
  await recordAuditEntry(entry);
  return entry;
}

/**
 * Reads back all audit entries for a given request id, most recent
 * first. Used for a lightweight "show me what the browser did" query
 * separate from the live response of an in-flight execution.
 */
export async function readAuditLog(requestId?: string): Promise<BrowserAuditEntry[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, "utf8");
    const entries = raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line) as BrowserAuditEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is BrowserAuditEntry => e !== null);
    const filtered = requestId ? entries.filter((e) => e.requestId === requestId) : entries;
    return filtered.reverse();
  } catch {
    return [];
  }
}