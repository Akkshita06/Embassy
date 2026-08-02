import "server-only";

/**
 * Merchants Stagehand is actually allowed to drive a browser against.
 * This is a *separate, narrower* allow-list from a mandate's
 * `merchants` list (src/lib/mock-data.ts) — a merchant can be
 * approved for spend under a mandate without Embassy having a
 * navigation script for it yet. Keep this list explicit and small;
 * adding a merchant here is a deliberate engineering decision (new
 * site-specific selectors/flows to verify), not just a policy change.
 */
export interface SupportedMerchant {
  /** Must match Mandate.merchants[].name / PurchaseRequest.merchant exactly (case-insensitive). */
  name: string;
  baseUrl: string;
}

export const SUPPORTED_MERCHANTS: SupportedMerchant[] = [
  {
    name: "Amazon",
    baseUrl: process.env.AMAZON_BASE_URL?.trim() || "https://www.amazon.in",
  },
];

export function getSupportedMerchant(merchantName: string): SupportedMerchant | undefined {
  const normalized = merchantName.trim().toLowerCase();
  return SUPPORTED_MERCHANTS.find((m) => m.name.trim().toLowerCase() === normalized);
}