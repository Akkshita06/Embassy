export type TxStatus = "approved" | "escalated" | "denied";

export interface LinkedCard {
  enrollmentId: string;
  last4: string;
  brand: string;
}

export interface MandateMerchant {
  name: string;
}

export interface Mandate {
  id: string;
  name: string;
  category: string;
  dailyLimit: number;
  perChargeLimit: number;
  merchants: MandateMerchant[];
  status: "active" | "paused";
  /**
   * Real Prava card-linking record (enrollmentId/last4/brand come back
   * from collectPAN's onSuccess). null for mandates that haven't had a
   * card linked yet — cap/merchant scope/frequency stay Embassy-owned
   * application data regardless of card-link state.
   */
  card: LinkedCard | null;
  /**
   * Amount actually spent against this mandate today. Real mandates
   * created through the card-link flow start at 0 (no spend yet) —
   * only seeded demo mandates carry a nonzero starting value here.
   */
  spentToday: number;
}

export interface Transaction {
  id: string;
  item: string;
  merchant: string;
  amount: number;
  category: string;
  status: TxStatus;
  mandate: string;
  timestamp: string;
  agent: string;
}

export const mandates: Mandate[] = [
  {
    id: "mnd_office",
    name: "Office Accessories",
    category: "Electronics & Peripherals",
    dailyLimit: 25000,
    perChargeLimit: 12000,
    merchants: [
      { name: "Amazon" },
      { name: "Flipkart" },
      { name: "Croma" },
    ],
    status: "active",
    card: { enrollmentId: "enr_demo_office", last4: "4242", brand: "visa" },
    spentToday: 15500,
  },
  {
    id: "mnd_subs",
    name: "Software Subscriptions",
    category: "SaaS & Tools",
    dailyLimit: 15000,
    perChargeLimit: 8000,
    merchants: [
      { name: "Stripe" },
      { name: "Vercel" },
      { name: "OpenAI" },
    ],
    status: "active",
    card: { enrollmentId: "enr_demo_subs", last4: "0117", brand: "mastercard" },
    spentToday: 4200,
  },
  {
    id: "mnd_travel",
    name: "Travel & Logistics",
    category: "Travel",
    dailyLimit: 40000,
    perChargeLimit: 20000,
    merchants: [
      { name: "MakeMyTrip" },
      { name: "Uber" },
      { name: "IRCTC" },
    ],
    status: "paused",
    card: { enrollmentId: "enr_demo_travel", last4: "8823", brand: "visa" },
    spentToday: 0,
  },
];

export const transactions: Transaction[] = [
  {
    id: "txn_8841",
    item: "Logitech MX Master 3S",
    merchant: "Amazon",
    amount: 8999,
    category: "Office Accessories",
    status: "approved",
    mandate: "Office Accessories",
    timestamp: "2026-07-28T09:14:00+05:30",
    agent: "Nova AI",
  },
  {
    id: "txn_8840",
    item: "Notion Team Plan (Annual)",
    merchant: "Notion",
    amount: 14200,
    category: "SaaS & Tools",
    status: "escalated",
    mandate: "Software Subscriptions",
    timestamp: "2026-07-27T17:02:00+05:30",
    agent: "Nova AI",
  },
  {
    id: "txn_8839",
    item: "Business Class — BLR to SFO",
    merchant: "MakeMyTrip",
    amount: 187400,
    category: "Travel",
    status: "denied",
    mandate: "Travel & Logistics",
    timestamp: "2026-07-27T11:40:00+05:30",
    agent: "Atlas AI",
  },
  {
    id: "txn_8838",
    item: "Keychron K2 Pro",
    merchant: "Flipkart",
    amount: 7499,
    category: "Office Accessories",
    status: "approved",
    mandate: "Office Accessories",
    timestamp: "2026-07-26T15:21:00+05:30",
    agent: "Nova AI",
  },
  {
    id: "txn_8837",
    item: "Vercel Pro Seat",
    merchant: "Vercel",
    amount: 1650,
    category: "SaaS & Tools",
    status: "approved",
    mandate: "Software Subscriptions",
    timestamp: "2026-07-26T10:05:00+05:30",
    agent: "Atlas AI",
  },
  {
    id: "txn_8836",
    item: "Uber to Client Office",
    merchant: "Uber",
    amount: 340,
    category: "Travel",
    status: "approved",
    mandate: "Travel & Logistics",
    timestamp: "2026-07-25T08:52:00+05:30",
    agent: "Nova AI",
  },
  {
    id: "txn_8835",
    item: "OpenAI API Credits",
    merchant: "OpenAI",
    amount: 9000,
    category: "SaaS & Tools",
    status: "escalated",
    mandate: "Software Subscriptions",
    timestamp: "2026-07-24T19:30:00+05:30",
    agent: "Atlas AI",
  },
  {
    id: "txn_8834",
    item: "Dell UltraSharp Monitor",
    merchant: "Croma",
    amount: 26999,
    category: "Office Accessories",
    status: "denied",
    mandate: "Office Accessories",
    timestamp: "2026-07-23T13:10:00+05:30",
    agent: "Nova AI",
  },
];

/* ------------------------------------------------------------------ */
/*  Embassy Workspace — purchase requests, agents, tasks, calendar     */
/* ------------------------------------------------------------------ */

export type RequestStatus = "approved" | "escalated" | "blocked" | "pending";

export type DecisionStepStatus = "passed" | "failed" | "waiting" | "skipped";

export interface DecisionStep {
  label: string;
  status: DecisionStepStatus;
  detail: string;
}

/*
 * Canonical decisionPath order used across all purchaseRequests below:
 *   1. Agent Request               — agent states intent (reasoning only, no verdict)
 *   2. Nanda Agent Orchestration    — originating agent identity resolved/verified
 *                                     (⚠️ STUBBED — src/lib/nanda/client.ts)
 *   3. Embassy Policy Evaluation    — mandate rules checked; this is Embassy's
 *                                     own deterministic logic
 *   4. Prava Mandate Check          — signed mandate/budget verified
 *   5. Payment / Human Approval     — executed or escalated to a human
 */

/**
 * Network-level metadata Prava's real session API already returns
 * (see src/lib/prava/session.ts — PravaSession + PravaCollectResult in
 * src/lib/prava/collect-pan.ts) but that Embassy wasn't surfacing
 * anywhere beyond a console.log. Populated once an over-cap approval
 * session is created and the card re-verification succeeds.
 */
export interface PravaTransactionMeta {
  /** Prava session id for this approval (session_id). */
  sessionId: string;
  /** Present once the merchant has fulfilled/settled the order. */
  orderId?: string;
  /** Prava's session status at last check (e.g. "completed", "created"). */
  status: string;
  /** ISO timestamp the session/credential expires, if still live. */
  expiresAt?: string;
  /** Card network, from the linked card re-verified for this purchase. */
  cardBrand: string;
  cardLast4: string;
  /** Prava card enrollment id the one-time credential was issued against. */
  cardEnrollmentId: string;
}

export interface PurchaseRequest {
  id: string;
  item: string;
  merchant: string;
  category: string;
  amount: number;
  agent: string;
  mandate: string;
  status: RequestStatus;
  timestamp: string;
  reason: string;
  decisionPath: DecisionStep[];
  urgent?: boolean;
  /**
   * Real Linq integration (see src/lib/linq/client.ts). Set once
   * POST /api/linq/send-approval has pushed an interactive iMessage
   * approval card for this request to the mandate holder.
   */
  linqMessageId?: string;
  /**
   * Mirrors the card's lifecycle: "sent" until the mandate holder taps
   * approve/deny in iMessage, then updated by the Linq webhook
   * (src/app/api/linq/webhook/route.ts). Undefined if a Linq card was
   * never sent for this request (e.g. it only went through the in-app
   * ApprovalDrawer).
   */
  linqStatus?: "sent" | "approved" | "denied" | "expired";
  /**
   * Real Prava integration — network-level transaction metadata from
   * the over-cap session + card re-verification. Undefined until a
   * request has actually gone through ApprovalDrawer's Prava flow.
   */
  pravaTransaction?: PravaTransactionMeta;
}

export const purchaseRequests: PurchaseRequest[] = [
  {
    id: "req_9001",
    item: "Stock Photo License — Annual",
    merchant: "Shutterstock",
    category: "Creative Assets",
    amount: 11499,
    agent: "Nova AI",
    mandate: "Software Subscriptions",
    status: "approved",
    timestamp: "2026-07-29T09:12:00+05:30",
    reason: "Within mandate scope, merchant allow-listed, spend cap not exceeded.",
    pravaTransaction: {
      sessionId: "sess_demo_9001",
      orderId: "ord_demo_shutterstock_9001",
      status: "completed",
      expiresAt: "2026-07-29T09:22:00+05:30",
      cardBrand: "mastercard",
      cardLast4: "0117",
      cardEnrollmentId: "enr_demo_subs",
    },
    decisionPath: [
      { label: "Agent Request", status: "passed", detail: "Nova AI requested a purchase of ₹11,499" },
      { label: "Nanda Agent Orchestration", status: "passed", detail: "Originating agent identity resolved via Nanda — verified" },
      { label: "Embassy Policy Evaluation", status: "passed", detail: "Category and merchant match mandate rules" },
      { label: "Prava Mandate Check", status: "passed", detail: "Signed mandate verified, budget available" },
      { label: "Payment / Human Approval", status: "passed", detail: "Executed automatically, no human step needed" },
    ],
  },
  {
    id: "req_9000",
    item: "SEO Tool Subscription Renewal",
    merchant: "Ahrefs",
    category: "SaaS & Tools",
    amount: 8300,
    agent: "Nova AI",
    mandate: "Software Subscriptions",
    status: "escalated",
    timestamp: "2026-07-29T08:40:00+05:30",
    reason: "Renewal amount is 22% above the last billed cycle — flagged for review.",
    urgent: true,
    linqMessageId: "msg_demo_9000",
    linqStatus: "sent",
    decisionPath: [
      { label: "Agent Request", status: "passed", detail: "Nova AI requested a renewal of ₹8,300" },
      { label: "Nanda Agent Orchestration", status: "passed", detail: "Originating agent identity resolved via Nanda — verified" },
      { label: "Embassy Policy Evaluation", status: "passed", detail: "Merchant allow-listed, category matches" },
      { label: "Prava Mandate Check", status: "waiting", detail: "Price variance requires human confirmation" },
      { label: "Payment / Human Approval", status: "waiting", detail: "Awaiting approval in Approval Center" },
    ],
  },
  {
    id: "req_8999",
    item: "Ad Credits Top-up",
    merchant: "Meta Ads",
    category: "Marketing",
    amount: 25000,
    agent: "Atlas AI",
    mandate: "Marketing Spend",
    status: "escalated",
    timestamp: "2026-07-28T18:22:00+05:30",
    reason: "Amount exceeds per-charge limit for this mandate.",
    urgent: true,
    decisionPath: [
      { label: "Agent Request", status: "passed", detail: "Atlas AI requested ₹25,000 in ad credits" },
      { label: "Nanda Agent Orchestration", status: "passed", detail: "Originating agent identity resolved via Nanda — verified" },
      { label: "Embassy Policy Evaluation", status: "failed", detail: "Exceeds ₹15,000 per-charge limit" },
      { label: "Prava Mandate Check", status: "waiting", detail: "Held pending human override" },
      { label: "Payment / Human Approval", status: "waiting", detail: "Awaiting approval in Approval Center" },
    ],
  },
  {
    id: "req_8998",
    item: "Logo Design Package",
    merchant: "99designs",
    category: "Creative Assets",
    amount: 18000,
    agent: "Nova AI",
    mandate: "Software Subscriptions",
    status: "blocked",
    timestamp: "2026-07-28T14:05:00+05:30",
    reason: "Merchant is not on the allow-list for any active mandate.",
    decisionPath: [
      { label: "Agent Request", status: "passed", detail: "Nova AI requested ₹18,000 for a logo package" },
      { label: "Nanda Agent Orchestration", status: "passed", detail: "Originating agent identity resolved via Nanda — verified" },
      { label: "Embassy Policy Evaluation", status: "failed", detail: "99designs is not an allow-listed merchant" },
      { label: "Prava Mandate Check", status: "skipped", detail: "Never reached Prava — blocked pre-mandate" },
      { label: "Payment / Human Approval", status: "skipped", detail: "No payment attempted" },
    ],
  },
  {
    id: "req_8997",
    item: "Content-Writing Tool — Team Seat",
    merchant: "Jasper",
    category: "SaaS & Tools",
    amount: 4200,
    agent: "Atlas AI",
    mandate: "Software Subscriptions",
    status: "approved",
    timestamp: "2026-07-28T11:30:00+05:30",
    reason: "Within mandate scope, merchant allow-listed, spend cap not exceeded.",
    decisionPath: [
      { label: "Agent Request", status: "passed", detail: "Atlas AI requested ₹4,200" },
      { label: "Nanda Agent Orchestration", status: "passed", detail: "Originating agent identity resolved via Nanda — verified" },
      { label: "Embassy Policy Evaluation", status: "passed", detail: "Category and merchant match mandate rules" },
      { label: "Prava Mandate Check", status: "passed", detail: "Signed mandate verified, budget available" },
      { label: "Payment / Human Approval", status: "passed", detail: "Executed automatically" },
    ],
  },
  {
    id: "req_8996",
    item: "Web Analytics Subscription",
    merchant: "Plausible",
    category: "SaaS & Tools",
    amount: 1900,
    agent: "Nova AI",
    mandate: "Software Subscriptions",
    status: "pending",
    timestamp: "2026-07-29T07:55:00+05:30",
    reason: "Awaiting Prava mandate confirmation callback.",
    decisionPath: [
      { label: "Agent Request", status: "passed", detail: "Nova AI requested ₹1,900" },
      { label: "Nanda Agent Orchestration", status: "passed", detail: "Originating agent identity resolved via Nanda — verified" },
      { label: "Embassy Policy Evaluation", status: "passed", detail: "Category and merchant match mandate rules" },
      { label: "Prava Mandate Check", status: "waiting", detail: "Callback in progress" },
      { label: "Payment / Human Approval", status: "waiting", detail: "Not yet reached" },
    ],
  },
  {
    id: "req_8995",
    item: "Stock Footage Bundle",
    merchant: "Envato Elements",
    category: "Creative Assets",
    amount: 5600,
    agent: "Nova AI",
    mandate: "Software Subscriptions",
    status: "blocked",
    timestamp: "2026-07-27T16:48:00+05:30",
    reason: "Category not permitted under any active mandate.",
    decisionPath: [
      { label: "Agent Request", status: "passed", detail: "Nova AI requested ₹5,600" },
      { label: "Nanda Agent Orchestration", status: "passed", detail: "Originating agent identity resolved via Nanda — verified" },
      { label: "Embassy Policy Evaluation", status: "failed", detail: "Category outside all active mandates" },
      { label: "Prava Mandate Check", status: "skipped", detail: "Never reached Prava — blocked pre-mandate" },
      { label: "Payment / Human Approval", status: "skipped", detail: "No payment attempted" },
    ],
  },
];

export interface AppAgent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "suspended";
  totalAttempts: number;
  approvalRate: number;
  blockedAttempts: number;
  spend: number;
  /**
   * Nanda agent orchestration/registry identity.
   * ⚠️ STUBBED — no real Nanda API docs available yet. See
   * src/lib/nanda/client.ts. `nandaAgentId` is undefined until an agent
   * has been registered with (the stubbed) Nanda; `verifiedIdentity`
   * reflects whatever Nanda's resolve step last reported and is what
   * Embassy's originating-agent / delegation check reads — it does not
   * default to true.
   */
  nandaAgentId?: string;
  verifiedIdentity: boolean;
}

export const agents: AppAgent[] = [
  {
    id: "agent_nova",
    name: "Nova AI",
    role: "Marketing & Content Ops",
    status: "active",
    totalAttempts: 86,
    approvalRate: 0.78,
    blockedAttempts: 9,
    spend: 214300,
    nandaAgentId: "nanda_stub_nova01",
    verifiedIdentity: true,
  },
  {
    id: "agent_atlas",
    name: "Atlas AI",
    role: "Growth & Ads",
    status: "active",
    totalAttempts: 41,
    approvalRate: 0.71,
    blockedAttempts: 6,
    spend: 96800,
    nandaAgentId: "nanda_stub_atlas02",
    verifiedIdentity: true,
  },
  {
    id: "agent_scribe",
    name: "Scribe AI",
    role: "Research Assistant",
    status: "idle",
    totalAttempts: 8,
    approvalRate: 0.88,
    blockedAttempts: 1,
    spend: 5400,
    // Not yet resolved against the (stubbed) Nanda registry — shown as
    // unverified rather than assumed true.
    nandaAgentId: undefined,
    verifiedIdentity: false,
  },
];

export interface WorkspaceTask {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignee: string;
  linked: string;
}

export const tasks: WorkspaceTask[] = [
  {
    id: "task_1",
    title: "Review SEO tool renewal",
    status: "todo",
    priority: "high",
    dueDate: "2026-07-30",
    assignee: "You",
    linked: "req_9000",
  },
  {
    id: "task_2",
    title: "Approve ad-credit purchase",
    status: "todo",
    priority: "high",
    dueDate: "2026-07-29",
    assignee: "You",
    linked: "req_8999",
  },
  {
    id: "task_3",
    title: "Update agent spend cap for Atlas AI",
    status: "in-progress",
    priority: "medium",
    dueDate: "2026-08-02",
    assignee: "You",
    linked: "agent_atlas",
  },
  {
    id: "task_4",
    title: "Renew stock-photo mandate",
    status: "todo",
    priority: "medium",
    dueDate: "2026-08-05",
    assignee: "You",
    linked: "mnd_subs",
  },
  {
    id: "task_5",
    title: "Add 99designs to merchant allow-list",
    status: "in-progress",
    priority: "low",
    dueDate: "2026-08-08",
    assignee: "You",
    linked: "req_8998",
  },
  {
    id: "task_6",
    title: "Quarterly budget review",
    status: "done",
    priority: "medium",
    dueDate: "2026-07-20",
    assignee: "You",
    linked: "mnd_office",
  },
];

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  type: "expiration" | "renewal" | "recurring" | "deadline" | "review";
  linked: string;
}

export const calendarEvents: CalendarEventItem[] = [
  { id: "ev_0", title: "Q3 mandate audit", date: "2026-07-15", type: "review", linked: "mnd_office" },
  { id: "ev_1", title: "Software Subscriptions mandate expires", date: "2026-08-01", type: "expiration", linked: "mnd_subs" },
  { id: "ev_2", title: "Ahrefs SEO renewal", date: "2026-08-03", type: "renewal", linked: "req_9000" },
  { id: "ev_3", title: "Approval deadline — Meta Ads top-up", date: "2026-07-29", type: "deadline", linked: "req_8999" },
  { id: "ev_4", title: "Vercel Pro recurring charge", date: "2026-08-06", type: "recurring", linked: "req_8837" },
  { id: "ev_5", title: "Monthly budget review", date: "2026-08-10", type: "review", linked: "mnd_office" },
  { id: "ev_6", title: "Travel & Logistics mandate expires", date: "2026-08-15", type: "expiration", linked: "mnd_travel" },
  { id: "ev_7", title: "Shutterstock license renewal", date: "2026-08-20", type: "renewal", linked: "req_9001" },
  { id: "ev_8", title: "Jasper seat recurring charge", date: "2026-08-28", type: "recurring", linked: "req_8997" },
  { id: "ev_9", title: "Vercel Pro recurring charge", date: "2026-09-06", type: "recurring", linked: "req_8837" },
  { id: "ev_10", title: "Office Accessories mandate review", date: "2026-09-12", type: "review", linked: "mnd_office" },
  { id: "ev_11", title: "Jasper seat recurring charge", date: "2026-09-28", type: "recurring", linked: "req_8997" },
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  approvalAuthority: boolean;
  status: "active" | "invited";
}

export const teamMembers: TeamMember[] = [
  { id: "tm_1", name: "You", role: "Owner", email: "you@studio.co", approvalAuthority: true, status: "active" },
  { id: "tm_2", name: "Priya Sharma", role: "Operations", email: "priya@studio.co", approvalAuthority: true, status: "active" },
  { id: "tm_3", name: "Dev Malhotra", role: "Finance (view-only)", email: "dev@studio.co", approvalAuthority: false, status: "invited" },
];

export const analyticsSummary = {
  totalPurchases: 142,
  approvalRate: 0.81,
  escalationRate: 0.12,
  denialRate: 0.07,
  weeklyVolume: [
    { day: "Mon", approved: 14, escalated: 2, denied: 1 },
    { day: "Tue", approved: 18, escalated: 3, denied: 0 },
    { day: "Wed", approved: 12, escalated: 1, denied: 2 },
    { day: "Thu", approved: 20, escalated: 4, denied: 1 },
    { day: "Fri", approved: 22, escalated: 2, denied: 1 },
    { day: "Sat", approved: 9, escalated: 1, denied: 0 },
    { day: "Sun", approved: 7, escalated: 1, denied: 1 },
  ],
  mandateUsage: [
    { name: "Office Accessories", value: 46 },
    { name: "Software Subscriptions", value: 61 },
    { name: "Travel & Logistics", value: 35 },
  ],
};