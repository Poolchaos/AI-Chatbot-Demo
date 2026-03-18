# 02 - Feature Set

## REAL Features (Actually Functional)

### Chat Widget
| Attribute | Detail |
|-----------|--------|
| **GEMINI-LEAD estimate** | 6 hours |
| **OPUS-BUILD estimate** | 8 hours |
| **Owner** | GEMINI-LEAD (UI) + OPUS-BUILD (streaming integration) |

**What it does:** Floating button → expandable chat panel. Streaming responses rendered in real-time. Markdown support for formatted answers. Typing indicator. Message history within session.

**Implementation approach:**
- Custom React component (no heavy chat library)
- Vercel AI SDK's `useChat` hook - **rejected** (see rationale below)
- Custom `useChat` hook using `fetch` with `ReadableStream` for explicit control over:
  - Token count extraction from response headers
  - Session ID management
  - Lead capture event parsing from streamed chunks
- Tailwind for styling, `react-markdown` for rendering

**Why 8 hours, not 6:**
- Streaming UI with proper error states (network drop, rate limit mid-stream, timeout) adds 1-2 hours
- Mobile responsiveness on the floating widget is fiddly
- The "typing indicator" to streamed text transition needs to feel smooth

**Demo risks:**
- Stream disconnects on slow network → mitigation: retry with exponential backoff, show "connection interrupted" message
- Widget z-index conflicts with landing page elements → test early

---

### LLM Agent API
| Attribute | Detail |
|-----------|--------|
| **GEMINI-LEAD estimate** | 8 hours |
| **OPUS-BUILD estimate** | 10 hours |
| **Owner** | OPUS-BUILD |

**What it does:** Next.js API route (`/api/chat`) that receives user message + session ID, loads conversation history, injects system prompt + content, calls LLM, streams response, tracks tokens, detects lead capture triggers.

**Implementation approach:**
- Single API route: `POST /api/chat`
- Request: `{ sessionId, message }`
- Response: SSE stream (streamed text chunks + metadata trailer)
- System prompt with full content injected every request (~3,000 tokens)
- Conversation history loaded from MongoDB, trimmed to last 10 exchanges (~2,000 tokens)
- Total context per request: ~6,000-8,000 tokens input
- Function calling for lead capture (see Lead Capture section)
- Token counting from API response metadata (not tiktoken - use the LLM's own reported usage)

**Why 10 hours, not 8:**
- Token tracking middleware + daily limit checking adds ~2 hours
- Graceful degradation logic (approaching limits, at limits) is real code, not trivial
- Error handling for LLM API failures (timeout, 429, 500) with user-facing messages

**Demo risks:**
- Gemini free tier rate limit hit during demo → mitigation: token budget system, fallback provider
- Cold start latency on first request → mitigation: warm-up request on app start
- LLM returns malformed response → mitigation: try/catch with fallback static response

---

### Lead Capture Engine
| Attribute | Detail |
|-----------|--------|
| **GEMINI-LEAD estimate** | 4 hours |
| **OPUS-BUILD estimate** | 5 hours |
| **Owner** | OPUS-BUILD (API logic) + GEMINI-LEAD (UI confirmation) |

**What it does:** When the LLM detects the user has provided contact info or expressed buying intent, it triggers a structured lead save to MongoDB.

**Implementation approach - Function Calling (Tools API):**

Using native LLM function calling, NOT regex/JSON parsing from output. Rationale:
- Function calling is a first-class feature in both Gemini and Claude
- The LLM decides when to call `save_lead` based on conversation context
- Returns structured data (`name`, `email`, `company_size`, `budget_range`, `event_type`)
- More reliable than parsing the LLM's text output for a JSON block
- If the LLM hallucinates a function call, worst case is we save a partial lead (harmless)
- If we parse output text, malformed JSON = lost lead + error in logs

**Function definition provided to LLM:**
```json
{
  "name": "save_lead",
  "description": "Save prospect contact information when they provide their details for follow-up",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Prospect's name" },
      "email": { "type": "string", "description": "Prospect's email address" },
      "company_name": { "type": "string", "description": "Prospect's company" },
      "estimated_headcount": { "type": "number", "description": "Estimated event headcount" },
      "budget_range": { "type": "string", "description": "Budget range if mentioned" },
      "event_type": { "type": "string", "description": "Type of event interested in" },
      "notes": { "type": "string", "description": "Key details from conversation" }
    },
    "required": ["email"]
  }
}
```

**Why 5 hours, not 4:**
- Email validation, deduplication (same session shouldn't create duplicate leads)
- UI confirmation ("Thanks! We'll send your custom proposal to {email}") needs to feel natural in the chat flow

**Demo risks:**
- LLM never triggers function call → mitigation: system prompt strongly encourages lead capture, test with known conversation flows
- LLM triggers function call prematurely → mitigation: only `email` is required, partial leads are fine

---

### Admin Dashboard
| Attribute | Detail |
|-----------|--------|
| **GEMINI-LEAD estimate** | 5 hours |
| **OPUS-BUILD estimate** | 7 hours |
| **Owner** | GEMINI-LEAD (UI layout) + OPUS-BUILD (API routes, data queries) |

**See [06-admin-dashboard.md](./06-admin-dashboard.md) for full scope.**

---

## VENEER Features (Looks Real, Minimal Effort)

### Landing Page
| Attribute | Detail |
|-----------|--------|
| **Estimate** | 4 hours |
| **Owner** | GEMINI-LEAD |
| **Necessity** | ESSENTIAL - the chatbot needs to live somewhere believable |

Minimum veneer: Hero with headline + subheadline, 3-feature grid with icons, one testimonial block (fake), CTA button. Stock photos from Unsplash. The chat widget floats over this page. Without a decent landing page, the demo feels like a prototype, not a product.

---

### Pricing Page
| Attribute | Detail |
|-----------|--------|
| **Estimate** | 2 hours |
| **Owner** | GEMINI-LEAD |
| **Necessity** | NICE-TO-HAVE - adds legitimacy but not critical |

Three static cards. No interactivity. The bot should be able to reference these prices from its content. Can be cut if behind schedule - the bot can just describe pricing verbally.

---

### Analytics Charts (Admin)
| Attribute | Detail |
|-----------|--------|
| **Estimate** | 2-3 hours |
| **Owner** | GEMINI-LEAD |
| **Necessity** | SCOPE RISK - cut if behind schedule |

Mocked charts with seeded data showing "conversations over time" and "lead conversion rate." Uses a lightweight chart library (recharts, not Chart.js - already in Next.js ecosystem). Looks good in screenshots. Zero functional value.

**OPUS-BUILD recommendation:** Cut this to a single stat card row (total conversations, total leads, avg messages per conversation) computed from real MongoDB data. Takes 1 hour instead of 3, and it's [REAL] data. More impressive in a demo.

---

## Vercel AI SDK - Why We're Not Using It

GEMINI-LEAD asked about Vercel AI SDK vs. custom hook. Decision: **custom hook.**

Reasons:
1. Vercel AI SDK abstracts away token counting - we need explicit access to `usage.prompt_tokens` and `usage.completion_tokens` from every response
2. Vercel AI SDK's `useChat` manages its own message state - we need to also sync with MongoDB session state
3. Function calling (tool use) with streaming in Vercel AI SDK has had breaking changes across versions; rolling our own is ~50 lines of code and fully under our control
4. We avoid a dependency that could introduce version conflicts with Next.js App Router

The custom hook is ~80 lines: manages messages array, sends POST to `/api/chat`, reads the SSE stream, appends chunks, handles errors. We own every line.

---

## Frontend Stack (Locked - Round 2)

*Owned by GEMINI-LEAD. Agreed by OPUS-BUILD.*

| Component | Technology | Rationale |
|-----------|-----------|----------|
| Styling | TailwindCSS + shadcn/ui | Pre-built accessible components for admin dashboard, buttons, cards. Saves hours on form inputs and tables. |
| Animations | Framer Motion | Chat widget slide-up, message pop-in animations. Sells the "premium" feel. Essential for demo wow factor. |
| Icons | Lucide React | Clean, minimal, standard. Already in shadcn/ui ecosystem. |
| Chat State | Custom React Context | Wraps the `useChat` hook to manage global widget state (open/close, unread badge). Decouples widget UI from chat logic. |

**OPUS-BUILD notes:**
- shadcn/ui is a good call - copy-paste components, no library lock-in, works natively with Tailwind
- Framer Motion adds ~30KB to bundle but justified for the demo feel
- The React Context wrapper around `useChat` needs to expose: `isLoading` boolean (true from POST fire until first SSE chunk), `leadSaved` event (from meta-chunk in stream), and `messages` array

---

## Chat UI State Machine (Locked - Round 3)

*Defined by GEMINI-LEAD. Confirmed by OPUS-BUILD.*

The `useChat` hook exposes two booleans (`isLoading`, `isStreaming`) and meta-events. Framer Motion keys off these:

| Hook State | UI Visual State | Animation |
|------------|----------------|----------|
| Idle | Input visible, placeholder "Ask about our packages..." | Chat bubble pulses slowly |
| `isLoading === true` | Three bouncing dots (typing indicator) | Crossfade input → loading |
| `isStreaming === true` | Text rendering chunk-by-chunk, `react-markdown` parsed | Auto scroll-to-bottom on each chunk |
| `type === "lead_saved"` | Green checkmark fades in next to header | Toast: "Details captured" |

**Hook flow:**
```
User sends → isLoading=true → POST fires → server processes →
first SSE chunk → isLoading=false, isStreaming=true →
stream ends → isStreaming=false
```

### Auto-Greeting Mechanism (Locked - Round 4)

When the chat widget opens (either via floating bubble or Hero CTA button):

1. `ChatProvider.openWidget()` sets `isOpen = true`
2. Checks `messages.length === 0`
3. If true → dispatches a silent initialization to the `useChat` hook
4. Hook sends a POST to `/api/chat` with `{ sessionId, message: "__INIT__" }`
5. API route detects the `__INIT__` sentinel and responds with the greeting stream (no user message stored)
6. Bot streams: "Welcome to Elevate Offsites! Are you planning a corporate retreat, or just exploring what we offer?"

This ensures the demo script Step 2 works - widget opens, greeting streams immediately, no user action needed.

The `__INIT__` message is never stored in conversation history. The greeting is the first assistant message in the session.

---

### Demo Reset Button (Locked - Round 7)

**Type:** [REAL] API + [VENEER] hidden UI trigger

**Purpose:** Allows the sales rep to reset the demo stage between pitches. No manual database clearing, no cookie clearing, no page refreshes.

**UI trigger:** Hidden 5-click hit-target in the admin dashboard footer. Invisible to casual observers. Calls `POST /api/admin/reset`.

**Backend:** `deleteMany({})` on conversations, leads, token_usage → re-run seed logic → return success. Guarded by `DEMO_MODE=true` env var.

**Post-reset:** Toast "Stage reset ✓" + auto-refresh after 500ms.

**Build estimate:** 1 hour total (0.5h OPUS-BUILD API, 0.5h GEMINI-LEAD UI)

---

### Admin Auth Veneer (Locked - Round 7)

**Type:** [VENEER]

**Decision:** Fake login screen, NOT hardcoded URL parameter.

**Implementation:**
- `/admin` shows login form (email + password + "Sign In" button using shadcn/ui)
- Accepts any non-empty password
- Sets `admin_session=demo` cookie (httpOnly, sameSite strict)
- Middleware redirects to login if cookie missing
- Cookie persists across refreshes - rep doesn't re-login during demo

**Demo script response:** "Auth is configured per-deployment. For this demo, it's simplified. In production, we integrate with your SSO provider."

**Build estimate:** 0.5 hours (GEMINI-LEAD)

---

### Pre-Flight Health Indicator (Locked - Round 8)

**Type:** [REAL]

**Purpose:** Gives the sales rep confidence before starting the demo. A 6px status dot in the absolute bottom-left of the landing page footer.

**Visual:**
- **Green:** System online - DB connected, LLM reachable
- **Red:** Backend failure - do not start the demo

**Implementation:**
- Single `fetch('/api/health')` on initial page load
- Response 200 → green dot. Response 503 or fetch error → red dot.
- No continuous polling - one shot is enough
- CSS: `position: absolute; bottom: 8px; left: 8px; width: 6px; height: 6px; border-radius: 50%;`

**Build estimate:** 0.5 hours total (OPUS-BUILD API, GEMINI-LEAD UI dot)

---

### Frontend Hardening (Locked - Round 8)

**Type:** [REAL] polish

**Purpose:** Prevent demo breakage when client goes off-script or uses a different device.

| Area | Implementation | Owner |
|------|---------------|-------|
| Mobile responsiveness | `ChatWindow` → `100vw`/`100vh` on `sm` breakpoints. `overflow-hidden` on `document.body` when open. | GEMINI-LEAD |
| Focus trapping | Auto-focus chat input on widget open. No click required. | GEMINI-LEAD |
| Empty states [VENEER] | "No conversations yet" graphic in admin Inbox tab for post-reset scenario. | GEMINI-LEAD |
| Landing page audit | Cross-reference every price and inclusion against `knowledge-base.md`. Zero discrepancies. | GEMINI-LEAD |
| Print CSS | `@media print` hides admin sidebar, header, action buttons. Clean table-only output for Export veneer. | GEMINI-LEAD |

**Build estimate:** 3 hours total (GEMINI-LEAD)
