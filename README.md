<div align="center">
  <a href="#"><img src=".github/assets/embassy-logo.png" width="180" alt="Embassy" /></a>

  <sup><i>The border control for agentic commerce.</i></sup>

  AI agents present credentials, not just requests — Embassy decides who spends, how much, and who has to sign off.

  <p>
    <a href="#quickstart"><strong>Quickstart</strong></a> ·
    <a href="#architecture"><strong>Architecture</strong></a> ·
    <a href="#api-routes"><strong>API</strong></a> ·
    <a href="#roadmap"><strong>Roadmap</strong></a>
  </p>

  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-0B0B0B?style=for-the-badge&logo=next.js&logoColor=F5EDE0">
    <img alt="React" src="https://img.shields.io/badge/React-19-0B0B0B?style=for-the-badge&logo=react&logoColor=EC9A72">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-0B0B0B?style=for-the-badge&logo=typescript&logoColor=EC9A72">
    <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v4-0B0B0B?style=for-the-badge&logo=tailwindcss&logoColor=F5EDE0">
  </p>
  <p>
    <img alt="License" src="https://img.shields.io/badge/license-unspecified-0B0B0B?style=for-the-badge&labelColor=0B0B0B&color=2A2A2A">
  </p>
</div>

<br />

```
  ┌─────────────────────────────────────────────────────────────────┐
  │  Agent: "Restock office mice from Amazon — ₹4,200"               │
  │                                                                   │
  │   ✓ Agent Reasoning        ordinary, well-justified restock       │
  │   ✓ Nanda Orchestration    identity verified                      │
  │   ✓ Policy Evaluation      in scope · under daily cap             │
  │   ✓ Prava Mandate Check    card on file                           │
  │   ✓ Senso Policy Context   no conflicting policy found            │
  │   ✓ Human Approval         not needed — executed automatically    │
  │                                                                   │
  │  → APPROVED · 340ms                                                │
  └─────────────────────────────────────────────────────────────────┘
```

## Why this exists

Every "agentic commerce" demo you've seen solves *checkout* — an agent finds a card, fills a form, completes a purchase. None of them solve *governance*: what is this agent actually allowed to buy, with whose money, up to what limit, and who finds out when it goes over?

That gap is where the money is lost, or where a company simply refuses to let agents touch a card at all.

Embassy is a policy-decision and audit layer that sits between an agent's purchase request and the money moving. Every request is checked against a **mandate** — a scoped policy with a merchant allow-list or category, a per-charge limit, and a daily cap — and produces a deterministic **approve / escalate / deny** verdict, with a full, readable trail of *why*. In-policy requests execute immediately. Out-of-policy requests get routed to a human — over iMessage, if you wire it up — before a rupee moves.

If you're building agents that spend money, or you're the person who has to explain to finance why an agent spent money, Embassy is the missing piece between the two of you.

## Features

| | |
|---|---|
| 🛂 **Deterministic policy engine** | One pure function, `runPolicyEvaluation`, is the *only* code path that can produce a verdict. The LLM, identity checks, and knowledge-base lookups all feed it as inputs — none of them can override it. |
| 🧠 **LLM intent extraction** | Free-text requests are parsed into structured fields (reason, category, item, budget ceiling, risk flags) for the audit trail — display only, never a decision input. |
| 📜 **Mandates** | Merchant allow-lists or category scoping, per-charge limits, daily caps, pause/resume, linked cards. |
| 🪪 **Agent identity resolution** | Requests from an unverified agent (per a Nanda-style registry) are forced to escalate — no silent auto-approval. |
| 🔎 **Grounded policy context** | Optional Senso knowledge-base lookups surface relevant policy text for human reviewers. Advisory only — cannot flip a verdict. |
| 💳 **Real card-linking** | Prava-hosted embeddable sessions for card enrollment, plus an over-cap re-authorization flow for spend above a mandate's normal ceiling. |
| 📲 **Human approval, over iMessage** | Escalated requests can push an interactive approval card via the Linq Partner API, with a signed webhook carrying the decision back. |
| 🧾 **Full decision timeline** | Every request renders its complete pipeline trail — Agent Request → Nanda → Policy → Prava → Senso → Human Approval — pass, fail, or skipped. |
| 🖥️ **Full workspace** | Requests, mandates, approval center, audit ledger, calendar, tasks, agent activity, team — plus a marketing site, guided demo, architecture explainer, and analytics. |

## Tech Stack

<table>
<tr><td><b>Framework</b></td><td>Next.js 16 (App Router, Turbopack)</td></tr>
<tr><td><b>UI</b></td><td>React 19, TypeScript 5</td></tr>
<tr><td><b>Styling</b></td><td>Tailwind CSS v4, custom design tokens</td></tr>
<tr><td><b>Animation</b></td><td>Framer Motion</td></tr>
<tr><td><b>Charts</b></td><td>Recharts</td></tr>
<tr><td><b>Icons</b></td><td>Lucide</td></tr>
<tr><td><b>LLM</b></td><td>Groq (default, OpenAI-compatible) or OpenAI, via the <code>openai</code> SDK</td></tr>
<tr><td><b>Payments</b></td><td>Prava embedded card-link sessions (<code>@prava-sdk/core</code>)</td></tr>
<tr><td><b>Agent identity</b></td><td>Nanda-style registry (stubbed, real-contract-ready)</td></tr>
<tr><td><b>Knowledge / grounding</b></td><td>Senso grounded search API</td></tr>
<tr><td><b>Human approval channel</b></td><td>Linq Partner API — iMessage cards, Standard Webhooks</td></tr>
<tr><td><b>Tooling</b></td><td>ESLint 9, <code>tsx</code>, <code>dotenv</code>, <code>clsx</code> + <code>tailwind-merge</code></td></tr>
</table>

## Architecture

```
 Purchase request (form / API)
          │
          ▼
 extractIntent() ─────────────► Groq / OpenAI chat completion
   agent/reason.ts               structures text — never decides
          │
          ▼
 resolveAgent() ──────────────► Nanda registry (stub or real)
   nanda/client.ts                verifies originating agent identity
          │
          ▼
 sensoSearch() ───────────────► Senso grounded search — advisory only
   senso/client.ts
          │
          ▼
 runPolicyEvaluation() ◄──────── mandate (client-held state)
   policy/engine.ts               THE decision: approved / escalated / blocked
          │
          ├── approved  → executes, no human step
          │
          └── escalated → sendApprovalMessage() ──► Linq iMessage card
                                                            │
                                                signed Standard Webhook
                                                            ▼
                                                verifyLinqWebhookSignature()
```

Every stage appends a `DecisionStep` to an ordered `decisionPath`, so the UI can render pass / fail / skipped for each pipeline stage — including stages never reached because an earlier one blocked the request.

<details>
<summary><b>Design decisions worth knowing</b></summary>
<br>

- **The policy engine is the single source of truth.** `runPolicyEvaluation` in `src/lib/policy/engine.ts` is a pure function: identity verification, LLM output, and knowledge-base context are inputs, never gates. Only mandate scope, per-charge/daily limits, and card-link status can produce a verdict.
- **LLM output never gates a decision.** `extractIntent()` produces descriptive text and risk flags for the audit trail; the policy engine never branches on anything the model returns.
- **No database.** This is a stateless demo — `src/lib/mock-data.ts` seeds mandates/transactions, and `spentToday` lives in React state for the session. Swap in persistent storage for production use.
- **Stubs are explicitly labeled.** `src/lib/nanda/client.ts` is a documented stub (no public Nanda API docs were available) — every value it returns carries `source: "stub"` so it's never mistaken for a live integration. Senso and Linq are real, documented integrations.
- **Secrets never reach the client.** Every third-party call is wrapped in `server-only` modules and Route Handlers; API routes return only the derived result.

</details>

<details>
<summary><b>Folder structure</b></summary>

```
embassy/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Public marketing landing page
│   │   ├── layout.tsx                  # Root layout, metadata, site chrome
│   │   ├── demo/                       # Interactive guided product demo
│   │   ├── architecture/               # In-app architecture explainer
│   │   ├── analytics/                  # Analytics dashboard
│   │   ├── history/                    # Transaction history
│   │   ├── settings/                   # Global settings
│   │   ├── workspace/                  # Authenticated-style app shell
│   │   │   ├── requests/               #   Purchase request submission & review
│   │   │   ├── mandates/               #   Mandate management
│   │   │   ├── approvals/              #   Human approval center
│   │   │   ├── ledger/                 #   Audit ledger
│   │   │   ├── calendar/               #   Calendar view
│   │   │   ├── tasks/                  #   Task board
│   │   │   ├── agents/                 #   Agent activity feed
│   │   │   └── team/                   #   Team / workspace settings
│   │   └── api/
│   │       ├── agent/reason/           # POST — LLM intent extraction
│   │       ├── requests/evaluate/      # POST — full orchestration + decision
│   │       ├── nanda/resolve/          # POST — agent identity resolution (stub)
│   │       ├── nanda/register-agent/   # POST — agent registration (stub)
│   │       ├── prava/session/          # POST — create card-link session
│   │       ├── prava/session/[id]/revoke/  # POST — revoke a session
│   │       ├── prava/over-cap-session/ # POST — over-cap re-authorization
│   │       ├── linq/send-approval/     # POST — send iMessage approval card
│   │       └── linq/webhook/           # POST — receive signed Linq events
│   ├── components/                     # Shared UI + workspace/ + demo/
│   └── lib/
│       ├── policy/engine.ts            # The deterministic decision engine
│       ├── agent/reason.ts             # LLM intent extraction (Groq/OpenAI)
│       ├── nanda/client.ts             # Agent identity registry (stub)
│       ├── senso/client.ts             # Grounded knowledge-base search
│       ├── prava/session.ts            # Card-linking session client
│       ├── linq/client.ts              # iMessage approval-card client
│       ├── linq/webhook.ts             # Standard Webhooks verification
│       └── mock-data.ts                # Seed data + shared types
├── scripts/senso-ingest.ts             # CLI: ingest docs into Senso's KB
└── public/                             # Static assets
```

</details>

## Quickstart

```bash
git clone <repository-url>
cd embassy
npm install
cp .env.example .env.local   # then fill in your own keys — see Configuration
npm run dev
```

Open **http://localhost:3000**. No keys? Head straight to `/demo` — it's fully seeded and needs nothing configured.

## Usage

- **`/`** — marketing overview.
- **`/demo`** — guided, animated walkthrough of the full pipeline (chat → reasoning → policy → approval → execution → receipt) on seeded data. No keys required.
- **`/workspace/mandates`** — create mandates: merchant allow-list or category, per-charge limit, daily cap, and a linked card via embedded Prava session.
- **`/workspace/requests`** — submit a purchase request (free text or structured) and watch it move through intent extraction, identity resolution, and the policy engine in real time.
- **`/workspace/approvals`** — review and act on escalated requests, optionally pushed to a phone as an iMessage card.
- **`/workspace/ledger`** — the full audit trail, per request.
- **`/architecture`** and **`/analytics`** — in-app pipeline explainer and aggregate metrics.

## Configuration

> [!NOTE]
> Nothing requires *every* key. Omit an integration's credentials and that pipeline step degrades gracefully (Senso context, Nanda verification) or fails with a clear, explicit error (Prava, the LLM step) — it never fails silently into a wrong decision.

<details open>
<summary><b>Environment variables</b></summary>
<br>

| Variable | Required | Description |
|---|:---:|---|
| `PRAVA_SECRET_KEY` | ✅ | Server-side secret for creating Prava card-link sessions. |
| `NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY` | ✅ | Client-side key that mounts the Prava embedded iframe. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL of the deployment (redirect/callback URLs). |
| `GROQ_API_KEY` | Recommended | Default LLM provider for intent extraction — Groq's free tier, OpenAI-compatible. |
| `GROQ_MODEL` | – | Override the default Groq model (`llama-3.3-70b-versatile`). |
| `OPENAI_API_KEY` | – | Fallback LLM provider if `GROQ_API_KEY` isn't set. |
| `SENSO_API_KEY` | Optional | Senso grounded search (`X-API-Key` auth). Step is skipped without it. |
| `SENSO_API_BASE` | – | Override the default Senso API base URL. |
| `NANDA_API_KEY` | Optional | Nanda agent registry key. **Client is a documented stub** — see `src/lib/nanda/client.ts`. |
| `NANDA_REGISTRY_URL` | – | Override the default (stub) registry base URL. |
| `LINQ_API_KEY` | Optional | Bearer token for the Linq Partner API (iMessage approval cards). |
| `LINQ_WEBHOOK_SECRET` | Optional | Standard Webhooks signing secret for verifying inbound decisions. |
| `LINQ_FROM_NUMBER` | Optional | Linq-provisioned sender number, E.164. |
| `LINQ_APPROVER_PHONE` | Optional | Default mandate-holder number that receives approval cards, E.164. |

</details>

> [!WARNING]
> An `.env.example` isn't currently checked into the repo — use the table above as your template, and never commit real keys in `.env.local` (it's already git-ignored).

## Screenshots

| Landing Page | Workspace Overview |
|---|---|
| _Add screenshot_ | _Add screenshot_ |

| Purchase Request Flow | Approval Center |
|---|---|
| _Add screenshot_ | _Add screenshot_ |

## API Routes

<details open>
<summary><b>All routes</b> — server-only, no upstream secret ever returned to the client</summary>
<br>

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/agent/reason` | Extracts structured intent (reason, category, risk flags, budget ceiling) from free text. Informational only. |
| `POST` | `/api/requests/evaluate` | Full orchestration — intent → Nanda → Senso → `runPolicyEvaluation`. Returns the verdict and complete decision trail. |
| `POST` | `/api/nanda/resolve` | Resolves an agent identifier against the Nanda registry (stub). |
| `POST` | `/api/nanda/register-agent` | Registers a new agent with the Nanda registry (stub). |
| `POST` | `/api/prava/session` | Creates a Prava embedded card-link session for a mandate. |
| `POST` | `/api/prava/session/[id]/revoke` | Revokes an existing Prava session by ID. |
| `POST` | `/api/prava/over-cap-session` | Creates a re-authorization session for spend above a mandate's normal limit. |
| `POST` | `/api/linq/send-approval` | Sends an interactive iMessage approval card for an escalated request. |
| `POST` | `/api/linq/webhook` | Verifies and parses inbound Linq webhook events (approve/deny decisions). |

</details>

## Components

- **`policy/engine.ts` → `runPolicyEvaluation`** — the deterministic core. Checks mandate existence, pause state, merchant/category scope, per-charge and daily caps, and card-link status; produces the verdict and the full `DecisionStep[]` trail.
- **`agent/reason.ts` → `extractIntent`** — wraps a Groq/OpenAI chat completion, with automatic model fallback on access errors and categorized error reporting (auth, rate limit, model access).
- **`prava/session.ts`** — typed client for creating/revoking Prava card-link sessions, including the over-cap variant.
- **`linq/client.ts` / `linq/webhook.ts`** — sends formatted iMessage approval cards and verifies inbound Standard Webhooks signatures.
- **`senso/client.ts`** — real integration against Senso's grounded search API, surfacing policy context for reviewers without touching the verdict.
- **`nanda/client.ts`** — clearly-labeled stub for agent identity resolution, shaped so a real registry client can drop in without touching any caller.
- **`components/workspace/*`** — mandate cards, request cards, the activity timeline that renders `DecisionStep[]`, the approval drawer, the audit receipt view.
- **`components/demo/*`** — the composable steps (`chat`, `reasoning`, `policy`, `approval`, `execution`, `receipt`) behind `/demo`.

## Performance Considerations

- **Turbopack** dev server for fast local iteration.
- **Server Components by default** across the App Router — `"use client"` scoped only to interactive pieces.
- **`server-only` guards** on every integration module, keeping secrets out of the client bundle entirely.
- **No redundant round-trips** — `/api/requests/evaluate` calls `extractIntent` and the policy engine in-process rather than hitting `/api/agent/reason` internally.
- **Session-scoped state** — mandate spend tracking lives in client state for the session rather than being re-fetched per evaluation.

## Security

- **Secrets stay server-side.** Only `NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` ever reach the browser.
- **Webhook signature verification** against the Standard Webhooks spec before any Linq payload is trusted.
- **Input validation** on every route — malformed JSON returns `400` before any downstream call fires.
- **Decision integrity** — the policy engine is isolated from LLM output and identity-resolution results; a hallucinated model response can't flip a verdict.
- **`.env.local` is git-ignored** — never commit real keys.

> [!IMPORTANT]
> This is demo/hackathon-grade software: no authentication, no per-workspace authorization, no persistent database. Treat any deployment as a prototype until those are added.

## Development

```bash
npm run dev            # Turbopack dev server
npm run build           # Production build
npm run start            # Serve the production build
npm run lint              # ESLint (eslint-config-next)
npm run senso:ingest    # Ingest docs into Senso's knowledge base
```

## Deployment

Standard Next.js App Router app — deploys cleanly to any Next.js-compatible host (e.g. [Vercel](https://vercel.com)).

1. Set every required variable from [Configuration](#configuration) in your host's dashboard.
2. Set `NEXT_PUBLIC_APP_URL` to your deployed domain (Prava redirects, Linq webhook callbacks).
3. Point your Linq webhook at `https://<your-domain>/api/linq/webhook` with the matching `LINQ_WEBHOOK_SECRET`.
4. `npm run build && npm run start` — or let your platform run these automatically.

No platform-specific config files (e.g. `vercel.json`) are currently in the repo; standard Next.js build detection is sufficient on most hosts.

## Roadmap

- [ ] Persistent storage for mandates, requests, and the audit ledger
- [ ] Authentication and per-workspace authorization
- [ ] Full Nanda integration once a public API contract exists (replacing the current stub)
- [ ] Confirm the exact Linq webhook event/payload for card decisions
- [ ] Multi-currency support beyond current INR formatting
- [ ] Real-time workspace updates (SSE/websocket) instead of client-owned state

## Contributing

1. Fork the repo, branch off `feature/your-feature`.
2. Keep the policy engine free of side effects and free of any dependency on LLM output — that's the one rule that isn't negotiable.
3. `npm run lint` and `npm run build` clean before opening a PR.
4. Describe *why*, not just *what*, in your PR description.

If you add a new integration you can't fully verify against real docs, label it as a stub the way `src/lib/nanda/client.ts` does — don't let an assumption pass as a contract.

## License

No license has been added yet. All rights reserved by the author until one is.

## Author

Built as a demonstration of policy-gated, auditable agentic commerce.

**_Add your name_** · _Add your email or website_ · _Add your GitHub_

<div align="center">
  <img src=".github/assets/embassy-logo.png" width="40" alt="" />
  <br />
  <sub>Every agent needs a mandate before it crosses the border.</sub>
</div>
