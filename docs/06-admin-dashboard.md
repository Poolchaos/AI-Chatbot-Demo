# 06 — Admin Dashboard

## Scope: Minimum Viable Admin

The admin dashboard needs to answer one question during the demo: **"What did the chatbot do?"** The client wants to see conversations, leads, and proof the system is working.

---

## Pages / Views

### Page 1: Overview (Home)
**Type:** [REAL] data + [VENEER] layout

**Stats Row (REAL — computed from MongoDB):**
| Stat Card | Data Source |
|-----------|-----------|
| Total Conversations (today) | `conversations.count({ createdAt: today })` |
| Total Leads Captured (today) | `leads.count({ createdAt: today })` |
| Avg Messages per Conversation | `conversations.aggregate(avg of messageCount)` |
| API Requests Today / Limit | `token_usage.findOne({ date: today }).totalRequests` / 1500 |

**Token Usage Gauge (REAL):**
- Simple progress bar: requests used / daily limit
- Color: green (0-80%), yellow (80-95%), red (95-100%)

**Recent Activity Feed (REAL):**
- Last 10 conversations, showing: time, message count, lead captured (yes/no)
- Click to expand → goes to conversation detail

**Charts (VENEER — seeded data):**
- "Conversations This Week" — bar chart with seeded + any real data
- "Lead Conversion Rate" — single percentage number (leads / conversations × 100)
- **Recommendation:** Skip charts entirely. The stat cards + activity feed are enough. If there's time on Day 6, add a simple bar chart.

**Build estimate:** 3 hours (stats API route + layout + stat cards + activity feed)

---

### Page 2: Conversations
**Type:** [REAL]

**List View:**
- Table: Session ID (truncated), Started At, Messages, Tokens Used, Lead Captured, Status
- Sorted by most recent
- Click row to expand

**Detail View (expandable or side panel):**
- Full message history rendered as chat bubbles
- User messages on right, bot messages on left
- Metadata sidebar: session duration, total tokens, provider used

**Build estimate:** 2.5 hours (API route + list + detail view)

---

### Page 3: Leads
**Type:** [REAL]

**Table View:**
- Columns: Name, Email, Company, Headcount, Budget, Event Type, Date, Status
- Sorted by most recent
- Status dropdown (New / Contacted / Qualified) — functional but [VENEER] in purpose

**Click row:**
- Shows the linked conversation (via `sessionId`)
- Shows the `notes` field from the lead

**Build estimate:** 1.5 hours (simple table + link to conversation)

---

### Page 4: Settings
**Type:** [VENEER]

- LLM Provider toggle (Gemini / Claude) — actually functional if we wire it to the env var reload
- Daily request limit display
- Knowledge base preview (shows the content that's injected into prompts)
- "Edit Content" button — [VENEER], or if time allows, a textarea that updates the `content` collection

**Build estimate:** 1 hour (static layout + content preview from DB)

---

### Navigation
- Sidebar: Overview | Conversations | Leads | Settings
- Header: "Elevate Offsites — Admin" + token usage badge (green/yellow/red)
- **No authentication.** The demo runs on a private server. Adding auth is 3+ hours we don't have. If the client asks, we say: "Auth is configured per-deployment. For this demo, we've kept it open for easy access."

---

## Total Dashboard Estimate

| Page | Hours |
|------|-------|
| Overview (stats + activity) | 3 |
| Conversations (list + detail) | 2.5 |
| Leads (table + link) | 1.5 |
| Settings (veneer) | 1 |
| Shared layout (sidebar, header) | 1 |
| API routes (4 endpoints) | 1.5 |
| **Total** | **10.5** |

**GEMINI-LEAD estimated 5 hours.** That's the UI-only estimate. Adding the API routes, data queries, and making the overview stats real pushes it to 10-11 hours. Split: GEMINI-LEAD owns layout/UI (5h), OPUS-BUILD owns API routes and data logic (5.5h).

---

## API Routes Needed

| Route | Method | Purpose | Response Shape |
|-------|--------|---------|----------------|
| `/api/admin/stats` | GET | Overview stats | `{ totalConversations: number, totalLeads: number, conversionRate: string, averageMessagesPerSession: number }` |
| `/api/admin/conversations` | GET | List conversations, paginated, with filters | `{ conversations: [...], total: number, page: number }` |
| `/api/admin/conversations/[sessionId]` | GET | Single conversation detail | Full conversation document |
| `/api/admin/leads` | GET | List leads, paginated | `{ leads: [...], total: number, page: number }` |
| `/api/admin/leads/[id]` | PATCH | Update lead status (new → contacted) | Updated lead document |
| `/api/admin/token-usage` | GET | Token usage for today + last 7 days |
| `/api/admin/reset` | POST | Reset demo stage (drop data + re-seed) | `{ success: true, seeded: { conversations: 5, leads: 2 } }` |

All routes read from MongoDB. No complex aggregation pipelines — simple `find()` with sort and limit. The stats route does a few `countDocuments()` calls.

---

## Health Endpoint (Locked — Round 8)

**Endpoint:** `GET /api/health`

**Purpose:** Pre-flight check for the sales rep's status dot (6px indicator in landing page footer). Also used by Docker healthcheck for container orchestration.

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "llm": true
  },
  "timestamp": "2026-03-18T14:30:00.000Z"
}
```

**Checks:**
1. MongoDB: `db.command({ ping: 1 })` — verifies connection
2. LLM: Lightweight reachability check (model instantiation, no generation)

**HTTP status:** 200 if all checks pass (`"healthy"`), 503 if any fail (`"degraded"`).

**Frontend integration:** Single fetch on page load. Green dot = 200. Red dot = 503 or fetch error. No continuous polling — Docker healthcheck handles that separately (every 30s).

**Build estimate:** 0.5 hours (OPUS-BUILD)

---

## Reset Demo API (Locked — Round 7)

**Endpoint:** `POST /api/admin/reset`

**Purpose:** Allows the sales rep to reset the demo stage between pitches without manually clearing the database. Triggered by a hidden 5-click hit-target in the admin footer (GEMINI-LEAD implementation).

**Guard:** Only executes when `NODE_ENV !== 'production'` OR `DEMO_MODE=true` env var is set. Returns `403` otherwise.

**Behavior:**
1. `deleteMany({})` on `conversations`, `leads`, and `token_usage` collections (preserves indexes)
2. Re-run seed logic inline (5 fake conversations, 2 fake leads, reset today's token counter)
3. Return `{ success: true, seeded: { conversations: 5, leads: 2 } }`

**Why `deleteMany` not `drop`:** Dropping collections destroys indexes from `mongo-init.js`. `deleteMany` is instantaneous on small collections and keeps indexes intact.

```typescript
// POST /api/admin/reset
export async function POST() {
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
    return Response.json({ error: 'Reset disabled' }, { status: 403 });
  }

  const db = await getDb();
  await Promise.all([
    db.collection('conversations').deleteMany({}),
    db.collection('leads').deleteMany({}),
    db.collection('token_usage').deleteMany({}),
  ]);

  await seedDemoData(db);

  return Response.json({ success: true, seeded: { conversations: 5, leads: 2 } });
}
```

**Frontend integration:** After reset fires, show a subtle toast ("Stage reset ✓") and auto-refresh the current admin page after 500ms delay.

**Build estimate:** 0.5 hours (OPUS-BUILD)

---

## Admin Auth Illusion (Locked — Round 7)

**Type:** [VENEER]

**Decision:** Fake login screen that accepts any password. NOT a hardcoded URL parameter.

**Why not URL parameter:** If the client glances at the browser bar, they see `/admin?key=demopass` in plaintext. That signals "we thought about security and did it badly" — worse than no auth.

**Implementation:**
- `/admin` route shows a clean login form (shadcn/ui `Input` + `Button`)
- Fields: email + password + "Sign In" button
- On submit: validate `password.length > 0`, set cookie `admin_session=demo` (httpOnly, sameSite strict)
- Middleware checks for cookie; if missing, redirect to login form
- Cookie persists across page refreshes — rep doesn't re-login during demo

**Demo script response if client asks:** "Auth is configured per-deployment. For this demo, it's simplified. In production, we integrate with your SSO provider (Okta, Azure AD)."

**Build estimate:** 0.5 hours (GEMINI-LEAD)
