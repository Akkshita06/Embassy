<div align="center">

# Embassy

**The trust and policy layer for agentic commerce — the border control where AI agents present mandates before they're allowed to spend.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-unspecified-lightgrey)](#license)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Screenshots](#screenshots)
- [API Routes](#api-routes)
- [Components](#components)
- [Performance Considerations](#performance-considerations)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

AI agents are starting to make real purchases on behalf of people and businesses — booking travel, restocking supplies, renewing subscriptions — but there's no standard way to answer the question every finance team asks the moment that happens: **"was this agent allowed to spend this money?"**

Embassy is a policy-decision and audit layer that sits between an AI agent's purchase request and the money actually moving. Every request is evaluated against a **mandate** (a scoped spending policy — merchant allow-list or category, per-charge limit, daily cap) and produces a deterministic **allow / escalate / deny** decision, along with a full, human-readable decision trail explaining *why*. Requests that fall within policy execute automatically; requests that don't are routed to a human for approval — over iMessage, if configured — before anything is charged.

It exists because "agentic commerce" tooling today is almost entirely about *making* the purchase (checkout automation, card issuing) and has little to say about *governing* it. Embassy is the missing control plane: a single, auditable place where spend policy is defined, evaluated, and logged, independent of which agent framework or payment rail is doing the actual buying.

**Target users:** teams building or operating AI agents that need to spend money — engineering teams prototyping agentic checkout, finance/ops teams who need an audit trail and human-in-the-loop guardrails, and hackathon/demo builders who want a working example of policy-gated agent commerce.

## Features

- 🛂 **Deterministic policy engine** — a single, side-effect-free function (`runPolicyEvaluation`) is the *only* thing that decides allow / escalate / deny. Nothing else in the request pipeline — not the LLM, not agent identity checks — can silently influence that verdict.
- 🧠 **LLM-based intent extraction** — free-text purchase requests are parsed into structured fields (reason, category, item, merchant, budget ceiling, risk flags) via an OpenAI-compatible chat completion, used only for *display*, never for the decision itself.
- 📜 **Mandates** — scoped spending policies with merchant allow-lists, category matching, per-charge limits, daily caps, pause/resume, and linked payment cards.
- 🪪 **Agent identity resolution** — originating agents are resolved against a Nanda-style registry before a request can auto-approve; unverified identity forces escalation.
- 🔎 **Grounded policy context** — optional Senso knowledge-base lookups surface relevant policy text alongside a decision for human reviewers (purely advisory — cannot itself change a verdict).
- 💳 **Real card-linking sessions** — Prava-hosted, embeddable sessions for card-on-file enrollment, including an over-cap re-authorization flow for spend above a mandate's normal limit.
- 📲 **Human approval over iMessage** — escalated requests can send an interactive approval card to the mandate holder's phone via the Linq Partner API, with signed webhook callbacks carrying the decision back.
- 🧾 **Full decision timeline** — every request produces an ordered, step-by-step audit trail (Agent Request → Nanda → Policy Evaluation → Prava Mandate Check → Senso Context → Human Approval) rendered in the workspace UI.
- 🖥️ **Full workspace UI** — purchase requests, mandates, approval center, audit ledger, calendar, tasks, agent activity, and team views, plus a public marketing site, live interactive demo, architecture explainer, and analytics dashboard.
- 🎛️ **Provider fallback for the LLM step** — defaults to Groq (free tier, OpenAI-compatible), with automatic fallback to a secondary model and an OpenAI code path if `OPENAI_API_KEY` is supplied instead.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack dev server) |
| UI Library | [React 19](https://react.dev) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/postcss`), custom CSS design tokens |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide](https://lucide.dev) |
| LLM / Intent Extraction | [Groq](https://groq.com) (default, OpenAI-compatible) or [OpenAI](https://platform.openai.com), via the `openai` SDK |
| Card-linking / Payments | [Prava](https://prava.space) embedded sessions (`@prava-sdk/core`) |
| Agent Identity | Nanda-style agent registry (stubbed client, real-contract-ready) |
| Knowledge / Policy Grounding | [Senso](https://senso.ai) grounded search API |
| Human Approval Channel | [Linq](https://linqapp.com) Partner API (iMessage cards + Standard Webhooks) |
| Utilities | `clsx`, `tailwind-merge`, `dotenv` |
| Tooling | ESLint 9 (`eslint-config-next`), `tsx` (ingestion script runner) |

## Architecture

### Request flow

```
Purchase request (form / API)
        │
        ▼
 extractIntent()  ──────────────► Groq / OpenAI chat completion
   (agent/reason.ts)               (structures text; never decides)
        │
        ▼
 resolveAgent()  ───────────────► Nanda registry (stub or real)
   (nanda/client.ts)               verifies originating agent identity
        │
        ▼
 sensoSearch()  ────────────────► Senso grounded search (advisory only)
   (senso/client.ts)
        │
        ▼
 runPolicyEvaluation() ◄───────── mandate (client-held state)
   (policy/engine.ts)              THE decision: approved / escalated / blocked
        │
        ├── approved  → executes, no human step
        │
        └── escalated → sendApprovalMessage() ──► Linq (iMessage approval card)
                                                          │
                                              signed Standard Webhook
                                                          ▼
                                              verifyLinqWebhookSignature()
                                              (approve/deny decision received)
```

Every stage appends a `DecisionStep` to an ordered `decisionPath` array, so the UI can render the exact reasoning — pass, fail, or skip — for each pipeline stage, even for requests that were blocked before reaching later stages.

### Design decisions worth knowing

- **The policy engine is the single source of truth.** `runPolicyEvaluation` in `src/lib/policy/engine.ts` is a pure function: identity verification, LLM output, and knowledge-base context all feed *into* it as inputs, but only its own deterministic rules (mandate scope, per-charge limit, daily cap, card-link status) can produce the allow/escalate/deny verdict.
- **LLM output never gates a decision.** `extractIntent()` produces descriptive text and risk flags for the audit trail only; the policy engine never branches on anything the model returns.
- **No database.** This is a stateless demo app — `src/lib/mock-data.ts` seeds mandates and transactions, and the requests page owns `spentToday` in React state for the duration of a session. A production deployment would replace this with persistent storage.
- **Stubs are explicitly labeled.** Nanda's client (`src/lib/nanda/client.ts`) is a documented stub (no public API docs were available at build time) — every value it returns is tagged `source: "stub"` so it's never confused with a live integration. Senso and Linq are real, documented integrations.
- **Secrets never reach the client.** Every third-party call (Prava, Linq, Nanda, Senso, Groq/OpenAI) happens inside `server-only`-marked modules and Next.js Route Handlers; API routes return only the derived result.

### Folder structure

```
embassy/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Public marketing landing page
│   │   ├── layout.tsx                  # Root layout, metadata, site chrome
│   │   ├── demo/                       # Interactive step-by-step product demo
│   │   ├── architecture/               # In-app architecture explainer
│   │   ├── analytics/                  # Analytics dashboard
│   │   ├── history/                    # Transaction history
│   │   ├── settings/                   # Global settings
│   │   ├── workspace/                  # Authenticated-style app shell
│   │   │   ├── layout.tsx              #   Sidebar + workspace chrome
│   │   │   ├── page.tsx                #   Workspace overview
│   │   │   ├── requests/               #   Purchase request submission & review
│   │   │   ├── mandates/               #   Mandate management
│   │   │   ├── approvals/              #   Human approval center
│   │   │   ├── ledger/                 #   Audit ledger
│   │   │   ├── calendar/               #   Calendar view
│   │   │   ├── tasks/                  #   Task board
│   │   │   ├── agents/                 #   Agent activity feed
│   │   │   ├── team/                   #   Team / workspace settings
│   │   │   └── settings/               #   Workspace-scoped settings
│   │   └── api/
│   │       ├── agent/reason/           # POST — LLM intent extraction
│   │       ├── requests/evaluate/      # POST — full orchestration + policy decision
│   │       ├── nanda/resolve/          # POST — agent identity resolution (stub)
│   │       ├── nanda/register-agent/   # POST — agent registration (stub)
│   │       ├── prava/session/          # POST — create card-link session
│   │       ├── prava/session/[id]/revoke/  # POST — revoke a session
│   │       ├── prava/over-cap-session/ # POST — over-cap re-authorization session
│   │       ├── linq/send-approval/     # POST — send iMessage approval card
│   │       └── linq/webhook/           # POST — receive signed Linq webhook events
│   ├── components/                     # Shared UI (nav, panels, charts, demo steps…)
│   │   └── workspace/                  # Workspace-specific components
│   └── lib/
│       ├── policy/engine.ts            # The deterministic decision engine
│       ├── agent/reason.ts             # LLM intent extraction (Groq/OpenAI)
│       ├── nanda/client.ts             # Agent identity registry (stub)
│       ├── senso/client.ts             # Grounded knowledge-base search
│       ├── prava/session.ts            # Card-linking session client
│       ├── prava/collect-pan.ts        # Card collection helpers
│       ├── linq/client.ts              # iMessage approval-card client
│       ├── linq/webhook.ts             # Standard Webhooks signature verification
│       ├── mock-data.ts                # Seed mandates/transactions + types
│       └── utils.ts                    # Formatting helpers (INR currency, dates)
├── scripts/
│   └── senso-ingest.ts                 # CLI script to ingest docs into Senso's KB
└── public/                             # Static assets
```

## Installation

**Prerequisites:** Node.js 20+ and npm.

```bash
git clone <repository-url>
cd embassy
npm install
```

Create a `.env.local` file in the project root (see [Configuration](#configuration) for details on each variable):

```bash
cp .env.example .env.local
# then fill in your own keys
```

Start the development server (Turbopack):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> An `.env.example` is included below for reference — generate your own `.env.local` from it rather than committing real keys.

## Usage

1. **Land on the marketing page** (`/`) for an overview of the product, or jump straight into `/demo` for a guided, animated walkthrough of the full decision pipeline (chat → reasoning → policy → approval → execution → receipt) using seeded data — no keys required.
2. **Enter the workspace** (`/workspace`) to work with real state:
   - Create or edit **mandates** (`/workspace/mandates`) — set merchant allow-lists or a category, a per-charge limit, and a daily cap, and link a card via the embedded Prava session.
   - Submit a **purchase request** (`/workspace/requests`) as free text or structured fields; it's routed through intent extraction, identity resolution, and the policy engine in real time.
   - Review **escalated requests** in the **Approval Center** (`/workspace/approvals`) — approve or deny, optionally pushed out as an iMessage card via Linq.
   - Inspect the full **audit ledger** (`/workspace/ledger`) and each request's step-by-step decision trail.
3. **Review architecture** (`/architecture`) for an in-app, visual explanation of how the pipeline fits together, and **analytics** (`/analytics`) for aggregate approval-rate and spend metrics.

## Configuration

All server-side integrations are configured via environment variables in `.env.local`.

| Variable | Required | Description | Example |
|---|---|---|---|
| `PRAVA_SECRET_KEY` | Yes, for card-linking | Server-side secret key for creating Prava card-link sessions. | `sk_test_...` |
| `NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY` | Yes, for card-linking | Client-side publishable key used to mount the Prava embedded iframe. | `pk_test_...` |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL of the deployed app (used for redirect/callback URLs). | `https://your-app.example.com` |
| `GROQ_API_KEY` | Recommended | API key for Groq's OpenAI-compatible chat completions — the default LLM provider for intent extraction (free tier, no card required). | `gsk_...` |
| `GROQ_MODEL` | No | Overrides the default Groq model (`llama-3.3-70b-versatile`). | `llama-3.3-70b-versatile` |
| `OPENAI_API_KEY` | No | Fallback LLM provider if `GROQ_API_KEY` is not set. | `sk-...` |
| `SENSO_API_KEY` | Optional | API key for Senso's grounded knowledge-base search (`X-API-Key` header). Without it, the Senso pipeline step is simply skipped. | `tgr_...` |
| `SENSO_API_BASE` | No | Overrides the default Senso API base URL. | `https://apiv2.senso.ai/api/v1` |
| `NANDA_API_KEY` | Optional | Key for the Nanda agent-identity registry. **Note:** the client is a documented stub pending public Nanda API docs — see `src/lib/nanda/client.ts`. | `stub_replace_me` |
| `NANDA_REGISTRY_URL` | No | Overrides the default (stub) Nanda registry base URL. | `https://registry.nanda.example/v1` |
| `LINQ_API_KEY` | Optional | Bearer token for the Linq Partner API, used to send iMessage approval cards. | `f7b73804-...` |
| `LINQ_WEBHOOK_SECRET` | Optional | Standard Webhooks signing secret configured on your Linq webhook endpoint; required to verify inbound approval decisions. | `whsec_...` |
| `LINQ_FROM_NUMBER` | Optional | The Linq-provisioned phone number approval cards are sent from (E.164). | `+14045550100` |
| `LINQ_APPROVER_PHONE` | Optional | Default mandate-holder phone number that receives approval cards (E.164). | `+919667500000` |

An `.env.example` is not currently checked into the repository; use the table above as the template for your own `.env.local`. None of the workspace UI, demo, or analytics pages require every key — omit an integration's keys to have that pipeline step skip gracefully (Senso context, Nanda verification) or fail explicitly with a clear error (Prava, the LLM step).

## Screenshots

| Landing Page | Workspace Overview |
|---|---|
| Add screenshot | Add screenshot |

| Purchase Request Flow | Approval Center |
|---|---|
| Add screenshot | Add screenshot |

## API Routes

All routes are Next.js Route Handlers under `src/app/api/`. Every route is server-only; no upstream secret is ever returned to the client.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/agent/reason` | Extracts structured purchase intent (reason, category, risk flags, budget ceiling) from free text via Groq/OpenAI. Informational only. |
| `POST` | `/api/requests/evaluate` | Full orchestration: intent extraction → Nanda identity resolution → Senso context → `runPolicyEvaluation`. Returns the final decision and complete decision trail. |
| `POST` | `/api/nanda/resolve` | Resolves an agent identifier against the Nanda registry (stub) and returns its verification status and capabilities. |
| `POST` | `/api/nanda/register-agent` | Registers a new agent with the Nanda registry (stub). |
| `POST` | `/api/prava/session` | Creates a Prava embedded card-link session for a mandate. |
| `POST` | `/api/prava/session/[id]/revoke` | Revokes an existing Prava session by ID. |
| `POST` | `/api/prava/over-cap-session` | Creates a re-authorization session for a purchase above a mandate's normal limit, tied to an existing card enrollment. |
| `POST` | `/api/linq/send-approval` | Sends an interactive iMessage approval card for an escalated purchase request via Linq. |
| `POST` | `/api/linq/webhook` | Receives and signature-verifies inbound Linq webhook events (approve/deny decisions from a tapped card). |

## Components

- **`policy/engine.ts` — `runPolicyEvaluation`**: the deterministic core. Evaluates mandate existence, pause state, merchant/category scope, per-charge and daily-limit caps, and card-link status, producing the final verdict and an ordered `DecisionStep[]` trail.
- **`agent/reason.ts` — `extractIntent`**: wraps an OpenAI-compatible chat completion (Groq by default) to turn free text into structured `ExtractedIntent`, with automatic fallback between models on access errors and detailed, categorized error reporting (auth, rate limit, model access).
- **`prava/session.ts`**: typed client for creating and revoking Prava embedded card-link sessions, including the over-cap re-authorization variant.
- **`linq/client.ts` / `linq/webhook.ts`**: sends formatted iMessage approval cards through the Linq Partner API and verifies inbound Standard Webhooks signatures (`webhook-id`.`webhook-timestamp`.`body` HMAC scheme).
- **`senso/client.ts`**: real integration against Senso's grounded-search API (`X-API-Key` auth), used to surface relevant policy text for a human reviewer without influencing the verdict.
- **`nanda/client.ts`**: explicitly-labeled stub for agent identity resolution, shaped to be swapped for a real Nanda registry client without touching any calling code.
- **`components/workspace/*`**: the workspace UI — mandate cards, purchase-request cards, the activity timeline that renders a request's `DecisionStep[]`, the approval drawer, and the audit receipt view.
- **`components/demo/*`**: the step components (`chat-step`, `reasoning-step`, `policy-step`, `approval-step`, `execution-step`, `receipt-step`) that compose the guided `/demo` walkthrough.
- **`components/trust-pipeline.tsx`, `workspace-preview.tsx`, `primitives.tsx`, `code-block.tsx`**: marketing-page building blocks for the landing page.

## Performance Considerations

- **Turbopack dev server** (`next dev`) for fast local iteration and incremental compilation.
- **Server Components by default** across the App Router, with `"use client"` scoped only to interactive pieces (forms, animated marketing sections, charts).
- **`server-only` guards** on every integration module (`prava`, `linq`, `nanda`, `senso`, `agent/reason`), preventing server-only code and secrets from ever being bundled into client JavaScript.
- **No unnecessary round-trips**: `/api/requests/evaluate` calls `extractIntent` and the policy engine directly in-process rather than making an internal HTTP call to `/api/agent/reason`.
- **Session-scoped state, not global re-fetching**: mandate spend (`spentToday`) is tracked in client state for the duration of a session, so repeated evaluations against the same mandate don't require re-reading from a data source on every request.

## Security

- **Secrets stay server-side.** `PRAVA_SECRET_KEY`, `GROQ_API_KEY`/`OPENAI_API_KEY`, `SENSO_API_KEY`, `NANDA_API_KEY`, `LINQ_API_KEY`, and `LINQ_WEBHOOK_SECRET` are only read inside `server-only`-marked modules and Route Handlers; only the client-safe `NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` are exposed to the browser.
- **Webhook signature verification.** Inbound Linq webhooks are verified against the Standard Webhooks specification (`verifyLinqWebhookSignature`) using `LINQ_WEBHOOK_SECRET` before any payload is trusted.
- **Input validation on every route.** Each API route parses and type-checks its JSON body, returning `400` on malformed input before any downstream call is made.
- **Decision integrity.** The policy engine is intentionally isolated from the LLM extraction step and identity-resolution output — a manipulated or hallucinated model response cannot itself flip an allow/deny verdict.
- **`.env.local` is git-ignored** by default (see `.gitignore`) — never commit real API keys or the Linq/Prava secrets to version control.

> This is a demo/hackathon-grade app with no authentication or authorization layer of its own (no user login, no per-workspace access control) and no persistent database — treat any deployment as a prototype, not a production financial system, until those are added.

## Development

```bash
npm run dev            # Start the Turbopack dev server
npm run build           # Production build
npm run start            # Serve the production build
npm run lint              # Run ESLint (eslint-config-next)
npm run senso:ingest    # Ingest documents into Senso's knowledge base (scripts/senso-ingest.ts)
```

## Deployment

Embassy is a standard Next.js App Router application and deploys cleanly to any Next.js-compatible host (e.g. [Vercel](https://vercel.com)).

1. Set all required environment variables from the [Configuration](#configuration) table in your hosting provider's dashboard.
2. Set `NEXT_PUBLIC_APP_URL` to the deployed domain (needed for Prava session redirects and Linq webhook callbacks).
3. Point your Linq webhook endpoint at `https://<your-domain>/api/linq/webhook` and configure the matching `LINQ_WEBHOOK_SECRET`.
4. Run `npm run build` followed by `npm run start`, or let your host run these automatically.

No deployment-platform-specific configuration files (e.g. `vercel.json`) are currently present in the repository — standard Next.js build detection is sufficient on most platforms.

## Roadmap

- [ ] Persistent storage for mandates, requests, and the audit ledger (replacing in-memory/session state)
- [ ] Authentication and per-workspace authorization
- [ ] Full Nanda integration once a public API/contract is available (replacing the current stub)
- [ ] Confirm and implement the exact Linq webhook event/payload for card decisions (currently a best-effort parse pending event-catalog confirmation)
- [ ] Multi-currency support beyond INR display formatting
- [ ] Webhook-driven real-time updates to the workspace UI (SSE/websocket) instead of client-owned state

## Contributing

Contributions are welcome. To propose a change:

1. Fork the repository and create a feature branch (`git checkout -b feature/your-feature`).
2. Make your changes, keeping the policy engine's decision logic free of side effects and free of any dependency on LLM output.
3. Run `npm run lint` and ensure the app builds cleanly with `npm run build`.
4. Open a pull request with a clear description of the change and, where relevant, the reasoning behind it.

Please avoid introducing new "stub" integrations without clearly labeling them as such (see `src/lib/nanda/client.ts` for the pattern this project follows).

## License

No license has been added to this repository yet. All rights are reserved by the author unless a license is added.

## Author

**Embassy** was built as a demonstration of policy-gated, auditable agentic commerce.

- Author: _Add your name_
- Contact: _Add your email or website_
- GitHub: _Add your GitHub profile link_
