# 09 - Sprint Board

## Round 9 Status - FINAL (Day 7 - 18 March 2026)

```
=== SPRINT BOARD (Round 9 - FINAL) ===

🔒 CODEBASE LOCKED (end of Day 6). No feature changes.

AGREED (new this round):
- [R9] Day 6 Gate: PASSED. Frontend hardening complete:
  Mobile viewport ✓, focus trap ✓, empty states ✓, landing page
  audit ✓, health dot green ✓, cross-browser ✓
- [R9] System Prompt v3 adversarial testing: PASSED.
  Joke deflection ✓, prompt extraction refused ✓, competitor
  redirect ✓.
- [R9] Docker dry run: PASSED.
  Build time: 42s. Image size: 148MB. Health check: first ping.
- [R9] Deployment plan LOCKED (5 steps):
  1. git clone
  2. Create .env (GEMINI_API_KEY, DEMO_MODE=true)
  3. docker compose up --build -d (with Caddy prod override)
  4. docker compose exec app node scripts/seed.js
  5. Verify HTTPS cert + health endpoint
- [R9] Caddy reverse proxy added as prod override:
  docker-compose.prod.yml with auto-provisioned Let's Encrypt SSL.
- [R9] Demo narrative (4 minutes) LOCKED:
  Min 1: The Stage (landing page walkthrough)
  Min 2: The Intelligence (Nature × 25 = $11,250 math)
  Min 3: The Pivot (150 headcount → enterprise → lead capture)
  Min 4: The ROI (admin dashboard with LIVE lead from demo)
  CRITICAL: Do NOT reset before showing dashboard. Show live lead
  first, then reset only if client wants to try the flow.
- [R9] Seed script: use `docker compose exec app node scripts/seed.js`
  (not npm run seed - standalone build doesn't support npm scripts).
- [R9] Dockerfile runner stage: add COPY scripts/ for seed access.
- [R9] Pre-demo checklist updated: verify HTTPS cert provisioned.

DAY 1: ✅ COMPLETE
DAY 2: ✅ COMPLETE
DAY 3: ✅ COMPLETE
DAY 4: ✅ COMPLETE
DAY 5: ✅ COMPLETE
DAY 6: ✅ COMPLETE - CODEBASE LOCKED
  - OPUS-BUILD: System prompt v3 ✓, GET /api/health ✓,
    20 test conversations ✓, seed validation ✓
  - GEMINI-LEAD: Mobile ✓, focus trap ✓, empty states ✓,
    landing audit ✓, status dot ✓, cross-browser ✓,
    settings veneer ✓, Docker dry run ✓

DAY 7: 🔄 IN PROGRESS - DEPLOYMENT & DEMO PREP
  - Deploy to private server (Caddy + HTTPS)
  - Seed fresh demo data
  - Dry run full 4-minute demo
  - Bug buffer (if anything breaks)

BLOCKERS: None.
NEEDS VERIFICATION: None.
CONTESTED ITEMS: None.

=== DESIGN SPRINT CLOSING ===
All 9 rounds complete. All gates passed. Ship it.
```

---

## Round 8 Status (Archived)

---

## Round 3 Status (Archived)

```
=== SPRINT BOARD (Round 2) ===

AGREED:
- Niche: Elevate Offsites (corporate retreat planning) - Option B
- Stack: Next.js + MongoDB + Docker Compose
- Content strategy: Full context injection (no RAG) - content fits in system prompt
- LLM primary: Gemini 2.0 Flash free tier (500-1,500 RPD, sufficient)
- LLM fallback: Claude 3.5 Haiku ($0.80/$4.00 per 1M tokens - VERIFIED)
- Lead capture: Native function calling (Tools API), not JSON output parsing
- Chat UI: Custom useChat hook, not Vercel AI SDK
- Admin dashboard: 4 pages (Overview, Conversations, Leads, Settings)
- No authentication on admin (private server demo)
- Docker: 2 services only (app + mongo)
- Streaming: SSE over POST
- Session limit: 20 messages, then prompt for email
- Daily limit: Warning at 80%, degraded at 95%, blocked at 100%
- Seed script for demo data
- 7-day timeline, ~61.5 person-hours total
- [R2] Hour estimates: +10.5h adjustment accepted (GEMINI-LEAD approved)
- [R2] Analytics: Real stat cards from MongoDB, not mocked Chart.js
- [R2] Provider abstraction: 2-hour insurance policy approved
- [R2] Function calling: Tools API confirmed over JSON parsing
- [R2] System prompt v2: 3 presentation rules added (micro-formatting,
  brevity/pacing, pricing math with >100 headcount rule)
- [R2] Frontend stack locked: TailwindCSS + shadcn/ui + Framer Motion +
  Lucide React + Custom React Context
- [R2] Pricing LOCKED: Urban $300/pp, Nature $450/pp, Executive $15k flat
  (up to 15). Over 100 headcount = custom enterprise pricing
- [R2] Demo script approved: 6-step "Golden Path", 4 minutes
- [R2] FAQ questions approved (12 questions, 3 categories)
- [R2] Claude pricing verified: $0.80 input / $4.00 output per 1M tokens
  = ~$0.014 per conversation

CONTESTED:
- (none remaining)

NEEDS VERIFICATION:
- Gemini 2.0 Flash: Day 1 gate test still required (25 sequential requests
  with our specific API key to confirm exact RPD limit)
- Gemini function calling behavior during streaming - confirm tool_call
  events are emitted during stream, not only after completion
  → TEST DAY 2

SCOPE CUT:
- Blog page - zero demo value
- Analytics charts - replaced with real stat cards
- Content editor in admin - edit markdown directly
- Authentication - private server context
- Nginx reverse proxy - Next.js serves directly
- Conversation summarization - history window sufficient

LLM DECISION:
- Provider: Gemini 2.0 Flash (primary) | Claude 3.5 Haiku (fallback)
- Model: gemini-2.0-flash | claude-3-5-haiku
- Cost: $0 (Gemini) | ~$1.40/100 conversations (Claude)
- Status: Proceed with Gemini, Day 1 gate test confirms exact limits

ROUND 2 RESOLUTIONS:
- OPUS-BUILD answered GEMINI-LEAD's 3 questions:
  1. useChat hook exposes `isLoading` = true from POST fire until first
     SSE chunk arrives. Framer Motion can trigger animation from this.
  2. When save_lead executes, API yields a meta-chunk in the SSE stream:
     {"type":"lead_saved","leadId":"..."} - frontend uses this to trigger
     success UI (green checkmark on chat header).
  3. Demo script flow confirmed and locked. GEMINI-LEAD proceeds with
     landing page build to support the narrative.

NEXT ROUND FOCUS:
- Begin implementation (Day 1 tasks)
- OPUS-BUILD: Gemini gate test, project scaffold, Docker setup
- GEMINI-LEAD: Knowledge base content, landing page wireframe
- Any remaining design questions surface during build
```

---

## Round 1 Status (Archived)

```
=== SPRINT BOARD (Round 1) ===

AGREED:
- Niche: Elevate Offsites (corporate retreat planning) - Option B
- Stack: Next.js + MongoDB + Docker Compose
- Content strategy: Full context injection (no RAG) - content fits in system prompt
- LLM primary: Gemini 2.0 Flash free tier (pending Day 1 verification)
- LLM fallback: Claude 3.5 Haiku (pay-per-use, ~$0.01/conversation)
- Lead capture: Native function calling (Tools API), not JSON output parsing
- Chat UI: Custom useChat hook, not Vercel AI SDK (need explicit token control)
- Admin dashboard: 4 pages (Overview, Conversations, Leads, Settings)
- No authentication on admin (private server demo)
- Docker: 2 services only (app + mongo), no nginx/redis/vector DB
- Streaming: SSE over POST, not WebSocket
- Session limit: 20 messages, then prompt for email
- Daily limit: Warning at 80%, degraded at 95%, blocked at 100%
- Seed script for demo data
- 7-day timeline, ~61.5 person-hours total

CONTESTED:
- Hour estimates: GEMINI-LEAD estimated lower across the board. OPUS-BUILD's
  adjusted estimates add ~8 hours total. Using OPUS-BUILD estimates as the plan
  (better to finish early than scramble).
  - Chat Widget: 6h → 8h
  - LLM Agent API: 8h → 10h
  - Lead Capture: 4h → 5h
  - Admin Dashboard: 5h → 10.5h (split across both devs)
- Analytics charts: GEMINI-LEAD proposed Chart.js mocked charts (2-3h).
  OPUS-BUILD recommends replacing with real stat cards from MongoDB (1h, more
  impressive). PENDING GEMINI-LEAD confirmation.

NEEDS VERIFICATION:
- Gemini 2.0 Flash free tier daily request limit - reports conflict between
  1,500 RPD (official docs) and 20-50 RPD (community reports late 2025).
  TEST ON DAY 1: Send 25 sequential requests to confirm.
  WHERE TO CHECK: Google AI Studio console, actual API testing.
- Claude 3.5 Haiku pricing as of March 2026 - estimated $0.80/$3.00 per
  1M tokens (input/output). Verify on Anthropic pricing page before committing
  as fallback.
- Gemini function calling behavior with streaming - confirm tool_call events
  are emitted during stream, not only after completion.

SCOPE CUT:
- Blog page - cut entirely. Zero demo value, just visual filler.
- Analytics charts - downgraded from Chart.js to stat cards (pending agreement).
- Content editor in admin - cut. Edit the markdown file directly.
- Authentication - cut. Private server, demo context.
- Nginx reverse proxy - cut. Next.js serves directly.
- Conversation summarization - cut. History window is sufficient.

LLM DECISION:
- Provider: Gemini 2.0 Flash (primary), Claude 3.5 Haiku (fallback)
- Model: gemini-2.0-flash | claude-3-5-haiku-20241022
- Cost: $0 if Gemini free tier holds | ~$1 for 100 demo conversations on Claude
- Architecture: Provider abstraction layer, swap via env var
- Status: PENDING DAY 1 VERIFICATION

NEXT ROUND FOCUS:
- GEMINI-LEAD to confirm or contest:
  1. Revised hour estimates
  2. Stat cards vs. Chart.js charts in admin
  3. Content plan assignments (OPUS-BUILD assigned FAQ + About page)
  4. Day-by-day schedule ownership
- Begin discussing demo script (what do we show the client, in what order?)
- Finalize knowledge base content outline (specific FAQ questions)
```
