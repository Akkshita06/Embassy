<div align="center">
  <img src=".github/assets/embassy-logo.png" width="160" alt="Embassy" />

  <sup><i>The border control for agentic commerce.</i></sup>

  <h3>Run every agent you own from one screen — without hiring a finance team to watch them.</h3>

  <p>
    <a href="#quickstart"><strong>Quickstart</strong></a> ·
    <a href="#the-workspace"><strong>The Workspace</strong></a> ·
    <a href="#architecture"><strong>Architecture</strong></a> ·
    <a href="#api-routes"><strong>API</strong></a>
  </p>

  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-0B0B0B?style=for-the-badge&logo=next.js&logoColor=F5EDE0">
    <img alt="React" src="https://img.shields.io/badge/React-19-0B0B0B?style=for-the-badge&logo=react&logoColor=EC9A72">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-0B0B0B?style=for-the-badge&logo=typescript&logoColor=EC9A72">
    <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v4-0B0B0B?style=for-the-badge&logo=tailwindcss&logoColor=F5EDE0">
  </p>
</div>

<br />

## The problem

You're a solo founder. You've got three agents doing real work — one restocking supplies, one renewing SaaS, one booking travel — and every single one of them can technically spend your card.

You didn't sign up to babysit a spreadsheet of who-bought-what. You also didn't sign up to find out your agent auto-renewed something for ₹40,000 three days after you told it not to. There's no finance team to catch it. There's just you, and you're already doing five jobs.

Embassy is the sixth hire you don't need to make. Set a spending policy once per agent — what it can buy, from where, up to how much — and Embassy enforces it automatically, escalating to *you* only when something actually needs your judgment. Everything else just... happens, and gets logged.

<table>
<tr>
<td width="50%" valign="top">

**Without Embassy**

Every agent purchase is a leap of faith. You find out what happened after it happened, usually from a card statement. Revoking access means going into three different dashboards. There's no single record of "why did this get approved."

</td>
<td width="50%" valign="top">

**With Embassy**

Every agent operates inside a mandate you set once. In-policy spend executes on its own. Anything outside the lines lands on your phone as an approval card — tap once, done. One ledger, every decision, fully explained.

</td>
</tr>
</table>

## The workspace

This isn't a policy engine bolted onto a dashboard — it's the operating console for a one-person company that happens to employ agents.

<details open>
<summary><b>Requests</b> — see what your agents are trying to do, live</summary>
<br>

Every purchase request an agent makes shows up here as it happens, with the reasoning behind it in plain English — not a raw JSON blob you have to parse at midnight.

</details>

<details>
<summary><b>Mandates</b> — the only place spend rules live</summary>
<br>

Define what "Software Subscriptions" or "Office Supplies" is allowed to cost, per charge and per day, and which merchants qualify. Pause a mandate the second something feels off — no code deploy required.

</details>

<details>
<summary><b>Approval Center</b> — your inbox, not your leash</summary>
<br>

Only the requests that actually need a human land here. Escalated purchases can hit your phone as an iMessage card — approve or deny from wherever you are, not from a laptop at 11pm.

</details>

<details>
<summary><b>Audit Ledger</b> — the record you'd want in front of an investor or an accountant</summary>
<br>

Every request, every decision, every reason — timestamped and permanent. When someone asks "why did the agent buy that," you have an answer in one click instead of a reconstruction project.

</details>

<details>
<summary><b>Agent Activity, Calendar, Tasks, Team</b> — the rest of running solo, in the same tab</summary>
<br>

Track what each agent has been doing, what's on the calendar, what's outstanding, and who else (if anyone) has access — without tab-switching to three other tools.

</details>

## How a request actually gets decided

```
  Agent: "Restock office mice from Amazon — ₹4,200"

  Agent Reasoning        ordinary, well-justified restock
  Nanda Orchestration    identity verified
  Policy Evaluation      in scope, under daily cap
  Prava Mandate Check    card on file
  Senso Policy Context   no conflicting policy found
  Human Approval         not needed — executed automatically

  → APPROVED · 340ms
```

One function decides that outcome — nothing else in the pipeline can override it. See [Architecture](#architecture) for exactly how.

## Quickstart

```bash
git clone <repository-url>
cd embassy
npm install
cp .env.example .env.local   # fill in your own keys — see Configuration
npm run dev
```

Open **http://localhost:3000**. No keys yet? Go straight to `/demo` — fully seeded, nothing to configure.

## Features

- **Deterministic policy engine.** One pure function, `runPolicyEvaluation`, is the only code path that can produce a verdict. The LLM, identity checks, and knowledge-base lookups feed it as inputs — none of them can override it.
- **Plain-English request parsing.** Free-text purchase requests are structured into reason, category, item, budget ceiling, and risk flags for the audit trail — never used to make the decision itself.
- **Mandates.** Merchant allow-lists or category scoping, per-charge limits, daily caps, pause and resume, linked cards.
- **Agent identity checks.** An unverified agent is forced to escalate, every time — no silent auto-approval on a spoofed identity.
- **Grounded policy context.** Optional knowledge-base lookups surface relevant policy text for you to read at approval time. Advisory only.
- **Real card-linking.** Embeddable Prava sessions for card enrollment, plus an over-cap re-authorization flow for spend above a mandate's normal ceiling.
- **Approvals over iMessage.** Escalated requests can reach you as an interactive card on your phone, with a signed webhook carrying your decision back.
- **A full decision timeline, per request.** Agent Request, identity check, policy evaluation, card check, policy context, human approval — pass, fail, or skipped, laid out end to end.

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
          |
          v
 extractIntent() -------------> Groq / OpenAI chat completion
   agent/reason.ts               structures text, never decides
          |
          v
 resolveAgent() ---------------> Nanda registry (stub or real)
   nanda/client.ts                verifies originating agent identity
          |
          v
 sensoSearch() ----------------> Senso grounded search, advisory only
   senso/client.ts
          |
          v
 runPolicyEvaluation() <-------- mandate (client-held state)
   policy/engine.ts               THE decision: approved / escalated / blocked
          |
          +-- approved  --> executes, no human step
          |
          +-- escalated --> sendApprovalMessage() --> Linq iMessage card
                                                             |
                                                 signed Standard Webhook
                                                             v
                                                 verifyLinqWebhookSignature()
```

Every stage appends a `DecisionStep` to an ordered `decisionPath`, so the UI can render pass, fail, or skipped for each pipeline stage — including stages never reached because an earlier one blocked the request.

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

## Usage

- **`/`** — marketing overview.
- **`/demo`** — guided, animated walkthrough of the full pipeline (chat, reasoning, policy, approval, execution, receipt) on seeded data. No keys required.
- **`/workspace/mandates`** — create mandates: merchant allow-list or category, per-charge limit, daily cap, and a linked card via embedded Prava session.
- **`/workspace/requests`** — submit a purchase request (free text or structured) and watch it move through intent extraction, identity resolution, and the policy engine in real time.
- **`/workspace/approvals`** — review and act on escalated requests, optionally pushed to your phone as an iMessage card.
- **`/workspace/ledger`** — the full audit trail, per request.
- **`/architecture`** and **`/analytics`** — in-app pipeline explainer and aggregate metrics.

## Configuration

> [!NOTE]
> Nothing requires every key. Omit an integration's credentials and that pipeline step degrades gracefully (Senso context, Nanda verification) or fails with a clear, explicit error (Prava, the LLM step) — it never fails silently into a wrong decision.

<details open>
<summary><b>Environment variables</b></summary>
<br>

| Variable | Required | Description |
|---|:---:|---|
| `PRAVA_SECRET_KEY` | Yes | Server-side secret for creating Prava card-link sessions. |
| `NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY` | Yes | Client-side key that mounts the Prava embedded iframe. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL of the deployment (redirect/callback URLs). |
| `GROQ_API_KEY` | Recommended | Default LLM provider for intent extraction — Groq's free tier, OpenAI-compatible. |
| `GROQ_MODEL` | No | Override the default Groq model (`llama-3.3-70b-versatile`). |
| `OPENAI_API_KEY` | No | Fallback LLM provider if `GROQ_API_KEY` isn't set. |
| `SENSO_API_KEY` | Optional | Senso grounded search (`X-API-Key` auth). Step is skipped without it. |
| `SENSO_API_BASE` | No | Override the default Senso API base URL. |
| `NANDA_API_KEY` | Optional | Nanda agent registry key. Client is a documented stub — see `src/lib/nanda/client.ts`. |
| `NANDA_REGISTRY_URL` | No | Override the default (stub) registry base URL. |
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
| `POST` | `/api/requests/evaluate` | Full orchestration — intent, Nanda, Senso, then `runPolicyEvaluation`. Returns the verdict and complete decision trail. |
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
- **`agent/reason.ts` → `extractIntent`** — wraps a Groq/OpenAI chat completion, with automatic model fallback on access errors and categorized error reporting.
- **`prava/session.ts`** — typed client for creating/revoking Prava card-link sessions, including the over-cap variant.
- **`linq/client.ts` / `linq/webhook.ts`** — sends formatted iMessage approval cards and verifies inbound Standard Webhooks signatures.
- **`senso/client.ts`** — real integration against Senso's grounded search API, surfacing policy context for you without touching the verdict.
- **`nanda/client.ts`** — clearly-labeled stub for agent identity resolution, shaped so a real registry client can drop in without touching any caller.
- **`components/workspace/*`** — mandate cards, request cards, the activity timeline that renders `DecisionStep[]`, the approval drawer, the audit receipt view.
- **`components/demo/*`** — the composable steps (chat, reasoning, policy, approval, execution, receipt) behind `/demo`.

## Performance Considerations

- Turbopack dev server for fast local iteration.
- Server Components by default across the App Router — `"use client"` scoped only to interactive pieces.
- `server-only` guards on every integration module, keeping secrets out of the client bundle entirely.
- No redundant round-trips — `/api/requests/evaluate` calls `extractIntent` and the policy engine in-process rather than hitting `/api/agent/reason` internally.
- Session-scoped state — mandate spend tracking lives in client state for the session rather than being re-fetched per evaluation.

## Security

- Secrets stay server-side. Only `NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` ever reach the browser.
- Webhook signature verification against the Standard Webhooks spec before any Linq payload is trusted.
- Input validation on every route — malformed JSON returns `400` before any downstream call fires.
- Decision integrity — the policy engine is isolated from LLM output and identity-resolution results; a hallucinated model response can't flip a verdict.
- `.env.local` is git-ignored — never commit real keys.

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

Standard Next.js App Router app — deploys cleanly to any Next.js-compatible host (e.g. Vercel).

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
4. Describe why, not just what, in your PR description.

If you add a new integration you can't fully verify against real docs, label it as a stub the way `src/lib/nanda/client.ts` does — don't let an assumption pass as a contract.

## License

No license has been added yet. All rights reserved by the author until one is.

## Author

Built as a demonstration of policy-gated, auditable agentic commerce, for the founder running it all alone.

**_Add your name_** · _Add your email or website_ · _Add your GitHub_

<div align="center">
  <img src=".github/assets/embassy-logo.png" width="36" alt="" />
  <br />
  <sub>Every agent needs a mandate before it crosses the border.</sub>
</div>
