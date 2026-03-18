# 08 - Timeline / Build Schedule

## Assumptions

- Two senior devs, evenings/weekends
- ~4-5 hours per person per day (realistic for after-work sessions)
- 7 calendar days (Day 1 = project start, Day 7 = demo day)
- Total budget: ~60-70 person-hours

---

## Day-by-Day Schedule

### Day 1 - Foundation + LLM Verification ✅ COMPLETE

| Task | Owner | Hours | Deliverable | Status |
|------|-------|-------|-------------|--------|
| Verify Gemini free tier limits (send 25 test requests) | OPUS-BUILD | 0.5 | Go/no-go on Gemini | ✅ Confirmed viable (500-1,500 RPD) |
| Next.js project scaffold (App Router, Tailwind, MongoDB driver) | OPUS-BUILD | 1.5 | Running `next dev` with DB connection | ✅ |
| Docker Compose setup (app + mongo, health check) | OPUS-BUILD | 1.5 | `docker compose up` works | ✅ Ports locked (3000/27017) |
| Write knowledge base content (packages, FAQs) | GEMINI-LEAD | 3 | `content/knowledge-base.md` complete | ✅ Delivered (~3,200 tokens) |
| Landing page wireframe + hero section | GEMINI-LEAD | 2 | Basic landing page renders | ✅ Architecture locked |
| **Day 1 total** | | **~8.5h** | Project runs, content exists, LLM confirmed | ✅ ALL GATES PASSED |

**Day 1 gate:** ✅ Gemini free tier confirmed viable. Proceeding as primary.

---

### Day 2 - LLM Core + Landing Page 🔄 IN PROGRESS

| Task | Owner | Hours | Deliverable | Status |
|------|-------|-------|-------------|--------|
| LLM provider abstraction layer (Gemini + Claude interfaces) | OPUS-BUILD | 2 | Provider swap via env var | 🔄 |
| `/api/chat` route - basic (no streaming yet): system prompt + content injection + single response | OPUS-BUILD | 2 | Bot answers questions from content | 🔄 |
| System prompt v2 implementation + testing | OPUS-BUILD | 1 | Prompt loaded, bot stays in persona | 🔄 |
| Seed script (5 fake conversations, 2 fake leads) | OPUS-BUILD | 1 | `npm run seed` populates DB | 🔄 |
| Landing page complete (hero, features, pricing) | GEMINI-LEAD | 3 | Full landing page | ✅ Hero, features, pricing done |
| Pricing page (static) | GEMINI-LEAD | 1.5 | Three-tier pricing renders | ✅ Cards with "Popular" badge |
| **Day 2 total** | | **~10.5h** | Bot answers questions. Site has pages. | |

**Day 2 gate:** Can ask the bot a question via curl/Postman and get a grounded answer.

---

### Day 3 - Streaming + Chat Widget 🔄 PARTIAL

| Task | Owner | Hours | Deliverable | Status |
|------|-------|-------|-------------|--------|
| Add streaming to `/api/chat` (SSE) | OPUS-BUILD | 2 | Responses stream token-by-token | ✅ |
| Token tracking per request (extract from API response, save to MongoDB) | OPUS-BUILD | 1.5 | `token_usage` collection updating | ✅ |
| MongoDB conversation storage (create/update on each message) | OPUS-BUILD | 1.5 | `conversations` collection populating | ✅ |
| Chat widget UI (floating button, expandable panel, message list) | GEMINI-LEAD | 3 | Visual chat widget on landing page | ✅ |
| Custom `useChat` hook (fetch + ReadableStream) | GEMINI-LEAD | 2 | Widget sends/receives messages with streaming | ⚠️ Blocked on SSE spec → NOW UNBLOCKED (R6) |
| **Day 3 total** | | **~10h** | Chat widget on site, streaming responses, data saving to DB | |

**Day 3 gate:** Backend complete. Frontend chat widget blocked on SSE spec - unblocked in Round 6.

---

### Day 4 - Lead Capture + Session Limits + Chat Polish ✅ COMPLETE

| Task | Owner | Hours | Deliverable | Status |
|------|-------|-------|-------------|--------|
| Function calling integration (save_lead tool definition) | OPUS-BUILD | 2 | LLM triggers lead saves | ✅ |
| Lead save API logic (validate, dedup, insert) | OPUS-BUILD | 1 | Leads appear in MongoDB | ✅ |
| Daily limit checking + graceful degradation | OPUS-BUILD | 2 | Rate limiting works: warning → degraded → blocked | ✅ |
| Session message limit (20 messages → prompt for email) | OPUS-BUILD | 0.5 | Session caps work | ✅ |
| Chat widget polish (animations, markdown, scroll, mobile) | GEMINI-LEAD | 2.5 | Widget feels production-quality | ✅ |
| Chat widget lead capture UX (header pulse, verified badge) | GEMINI-LEAD | 1 | User sees "team will follow up" | ✅ |
| useChat SSE parser implementation | GEMINI-LEAD | 2 | Parser handles all 5 chunk types | ✅ |
| Admin dashboard layout shell (/admin) | GEMINI-LEAD | 1 | Sidebar, stat grid, token gauge ready | ✅ |
| **Day 4 total** | | **~12h** | Lead capture + limits + polish + admin shell | ✅ |

**Day 4 gate:** ✅ PASSED (Round 7). Full Golden Path demo script tested locally:
- Cold Start / Auto-Greet: PASS (TTFT ~450ms)
- Knowledge Retrieval: PASS
- Pricing Math: PASS ($11,250 for 25×Nature)
- Lead Capture Trigger: PASS (150 headcount → enterprise pricing → email ask)
- Limit Enforcement: PASS (message 21 → SESSION_LIMIT error chunk)

---

### Day 5 - Admin Dashboard + Demo Infrastructure ✅ COMPLETE

| Task | Owner | Hours | Deliverable | Status |
|------|-------|-------|-------------|--------|
| Admin overview page (stat cards, token gauge, activity feed) | GEMINI-LEAD | 2 | Overview page with real data via /api/admin/stats | ✅ |
| Admin conversations page (list + detail w/ MessageBubble reuse) | GEMINI-LEAD | 2 | Can view all conversations | ✅ |
| Admin leads page (sortable table + [VENEER] Export to CSV) | GEMINI-LEAD | 1.5 | Lead table renders with export button | ✅ |
| Admin auth veneer (fake login screen, cookie-based) | GEMINI-LEAD | 0.5 | Login form blocks /admin without cookie | ✅ |
| Admin API routes (`/api/admin/*` - 6 endpoints) | OPUS-BUILD | 3 | All admin data endpoints working | ✅ |
| `POST /api/admin/reset` (demo reset + re-seed) | OPUS-BUILD | 0.5 | Reset button clears + re-seeds | ✅ |
| Token usage display in admin | OPUS-BUILD | 1 | Usage gauge/bar on overview | ✅ |
| Hidden "Reset Stage" 5-click button in admin footer | GEMINI-LEAD | 0.5 | Rep can reset stage mid-demo | ✅ |
| **Day 5 total** | | **~11h** | Admin dashboard functional + demo infrastructure | ✅ |

**Day 5 gate:** ✅ PASSED (Round 8). Admin dashboard fully wired with real data. Reset button works flawlessly. Fake login blocks unauthenticated access. Export veneer triggers clean print-to-PDF. Inbox transcripts reuse MessageBubble component.

---

### Day 6 - Polish + Prompt Tuning + Docker Prep 🔄 IN PROGRESS

| Task | Owner | Hours | Deliverable | Status |
|------|-------|-------|-------------|--------|
| System prompt v3 (deflection rules 10-12) | OPUS-BUILD | 1 | Prompt handles competitors, off-topic, adversarial | ✅ Drafted |
| `GET /api/health` endpoint (DB + LLM check) | OPUS-BUILD | 0.5 | Health endpoint returns checks | 🔄 |
| Run 20 test conversations, document failures | OPUS-BUILD | 1.5 | Test log with pass/fail | 🔄 |
| Seed script final validation | OPUS-BUILD | 0.5 | Dashboard looks populated fresh | 🔄 |
| Mobile responsiveness (viewport lock, overflow-hidden) | GEMINI-LEAD | 1 | Chat widget works on mobile | 🔄 |
| Focus trapping (auto-focus input on widget open) | GEMINI-LEAD | 0.5 | No-click input UX | 🔄 |
| Empty states ("No conversations yet" graphic) | GEMINI-LEAD | 0.5 | Admin handles zero-data gracefully | 🔄 |
| Landing page audit (copy vs knowledge-base.md) | GEMINI-LEAD | 0.5 | Zero price/inclusion discrepancies | 🔄 |
| Pre-flight status dot (6px health indicator) | GEMINI-LEAD | 0.5 | Green/red dot in footer | 🔄 |
| Cross-browser testing (Chrome, Firefox, Safari, mobile) | GEMINI-LEAD | 1 | No visual breakage | 🔄 |
| Admin settings page [VENEER] | GEMINI-LEAD | 1 | Settings page exists | 🔄 |
| Docker dry run (`docker compose up --build -d`) | BOTH | 0.5 | Production image verified locally | ✅ |
| **Day 6 total** | | **~9h** | Everything polished, tested, codebase LOCKED | ✅ |

**Day 6 gate:** ✅ PASSED (Round 9). System prompt v3 tested (adversarial: joke, prompt extraction, competitor - all deflected). Health endpoint green. Docker dry run: 42s build, 148MB image, health check first ping. No visual breakage. Landing page copy matches knowledge-base.md. **CODEBASE LOCKED.**

---

### Day 7 - Deployment & Demo Prep 🔄 IN PROGRESS

| Task | Owner | Hours | Deliverable | Status |
|------|-------|-------|-------------|--------|
| Deploy to private server (git clone + docker compose) | GEMINI-LEAD | 1 | Containers running on server | 🔄 |
| Create .env with live Gemini key + DEMO_MODE=true | GEMINI-LEAD | 0.1 | Secrets configured | 🔄 |
| Caddy reverse proxy + HTTPS (docker-compose.prod.yml) | GEMINI-LEAD | 0.5 | Auto-provisioned Let's Encrypt cert | 🔄 |
| Seed demo data (`docker compose exec app node scripts/seed.js`) | GEMINI-LEAD | 0.5 | Dashboard populated | 🔄 |
| Run demo day checklist (see Docker doc) | OPUS-BUILD | 0.5 | All checks pass | 🔄 |
| Verify HTTPS cert + health endpoint on live server | BOTH | 0.2 | `curl -I https://domain` returns 200 | 🔄 |
| Dry run full 4-minute demo (Golden Path) | BOTH | 1 | No surprises | 🔄 |
| **Bug buffer** | BOTH | 2 | Fix anything that broke | 🔄 |
| **Day 7 total** | | **~5.8h** | Demo-ready | |

---

## Hour Summary

| Owner | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 | Total |
|-------|-------|-------|-------|-------|-------|-------|-------|-------|
| OPUS-BUILD | 3.5 | 5 | 5 | 5.5 | 4 | 4.5 | 2.5 | **30** |
| GEMINI-LEAD | 5 | 4.5 | 5 | 3.5 | 6.5 | 3.5 | 1.5 | **29.5** |
| **Both** | - | - | - | - | - | - | 1 | **1** |
| **Daily total** | 8.5 | 9.5 | 10 | 9 | 10.5 | 8 | 6 | **61.5** |

**Total: ~61.5 person-hours across 7 days.** Tight but doable for two senior devs.

---

## Critical Path

The critical path runs through OPUS-BUILD's LLM work:

```
Day 1: Gemini verification → scaffold
Day 2: Provider abstraction → API route → system prompt
Day 3: Streaming → token tracking → MongoDB storage
Day 4: Function calling → lead save → rate limiting
```

If Day 1's Gemini verification fails, we switch to Claude and lose 0.5 hours. No other task causes more than a 1-hour slip.

GEMINI-LEAD's work is parallel after Day 1 (content). The chat widget (Day 3) needs the streaming endpoint to be ready - this is the one dependency crossover.

---

## Scope Cut Triggers

If behind schedule at any checkpoint:

| Checkpoint | Cut |
|------------|-----|
| End of Day 3: streaming not working | Drop streaming, use simple request/response. Add "typing..." delay for UX. Saves 2 hours. |
| End of Day 4: function calling unreliable | Switch to JSON parsing from LLM output for lead capture. Saves 1 hour of debugging. |
| End of Day 5: admin dashboard behind | Cut settings page, cut analytics charts, keep only conversations + leads tables. Saves 3 hours. |
| End of Day 6: polish incomplete | Ship as-is. Focus demo on chatbot flow, not pixel perfection. |
