# 05 — MongoDB Schema

## Collections Overview

| Collection | Purpose | Write Frequency | Read Frequency |
|------------|---------|----------------|----------------|
| `conversations` | Chat session history + metadata | Every message | Every message (history) + admin dashboard |
| `leads` | Captured prospect info | On lead capture (tool call) | Admin dashboard |
| `token_usage` | Daily token/request counters | Every message (atomic increment) | Every message (limit check) + admin dashboard |
| `content` | Knowledge base content cache | On deploy/update | On app startup (loaded into memory) |

---

## Collection: `conversations`

```javascript
{
  _id: ObjectId,
  sessionId: "uuid-v4-string",           // unique per browser session
  messages: [
    {
      role: "user" | "assistant",
      content: "message text",
      timestamp: ISODate,
      tokens: {                           // null for user messages
        prompt: 5200,
        completion: 340,
        total: 5540
      }
    }
  ],
  totalTokens: {
    prompt: 52000,
    completion: 3400,
    total: 55400
  },
  messageCount: 12,
  leadCaptured: false,                    // true if save_lead was called
  leadId: ObjectId | null,                // reference to leads collection
  status: "active" | "completed" | "limit_reached",
  metadata: {
    userAgent: "Mozilla/5.0...",
    ip: "hashed-ip",                      // hashed for privacy, useful for analytics
    startedAt: ISODate,
    lastMessageAt: ISODate,
    provider: "gemini" | "claude"         // which LLM served this conversation
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes:**
```javascript
db.conversations.createIndex({ sessionId: 1 }, { unique: true })
db.conversations.createIndex({ createdAt: -1 })                    // admin dashboard: recent conversations
db.conversations.createIndex({ leadCaptured: 1, createdAt: -1 })   // admin dashboard: filter by lead status
db.conversations.createIndex({ "metadata.lastMessageAt": 1 }, { expireAfterSeconds: 7776000 }) // 90-day TTL
```

**Notes:**
- `sessionId` is generated client-side (UUID v4) and stored in `sessionStorage` — survives page refreshes but not tab close
- Messages array grows with conversation; document size will be <50KB even for a 20-message conversation
- `totalTokens` is a pre-computed sum for dashboard display (avoids aggregation on read)

---

## Collection: `leads`

```javascript
{
  _id: ObjectId,
  sessionId: "uuid-v4-string",           // links back to conversation
  email: "prospect@company.com",          // required, validated
  name: "Jane Smith" | null,
  companyName: "Acme Corp" | null,
  estimatedHeadcount: 50 | null,
  budgetRange: "$10,000-$25,000" | null,
  eventType: "team retreat" | null,
  notes: "Interested in nature package for Q3" | null,
  source: "chatbot",                      // always "chatbot" for now
  status: "new" | "contacted" | "qualified",  // [VENEER] — only "new" is set automatically
  createdAt: ISODate
}
```

**Indexes:**
```javascript
db.leads.createIndex({ email: 1 })                      // dedup check
db.leads.createIndex({ createdAt: -1 })                  // admin dashboard: recent leads
db.leads.createIndex({ sessionId: 1 })                   // link to conversation
```

**Notes:**
- Email is validated server-side before insert (basic regex + MX check is overkill — just regex)
- Deduplication: if same email + same sessionId exists, update instead of insert. Different session = new lead (they came back).
- `status` field exists for the admin dashboard to look like a CRM. Only "new" is ever set by the system. Changing status is [VENEER] — a dropdown that updates MongoDB but has no automation behind it.

---

## Collection: `token_usage`

```javascript
{
  _id: ObjectId,
  date: "2026-03-20",                    // YYYY-MM-DD string, partition key
  totalRequests: 342,
  totalInputTokens: 1800000,
  totalOutputTokens: 450000,
  totalTokens: 2250000,
  requestsByHour: {                       // optional: for hourly chart in dashboard
    "09": 12,
    "10": 45,
    "14": 89
    // ...
  },
  updatedAt: ISODate
}
```

**Indexes:**
```javascript
db.token_usage.createIndex({ date: 1 }, { unique: true })
db.token_usage.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 7776000 }) // 90-day TTL
```

**Update pattern (atomic, every request):**
```javascript
db.token_usage.updateOne(
  { date: todayString },
  {
    $inc: {
      totalRequests: 1,
      totalInputTokens: promptTokens,
      totalOutputTokens: completionTokens,
      totalTokens: totalTokens,
      [`requestsByHour.${currentHour}`]: 1
    },
    $set: { updatedAt: new Date() }
  },
  { upsert: true }
)
```

No cron job. No counter resets. New day = new document. Clean.

---

## Collection: `content`

```javascript
{
  _id: ObjectId,
  key: "knowledge-base",                 // single document for our use case
  content: "full markdown content string",
  tokenCount: 2500,                       // pre-counted for budget tracking
  version: 1,
  updatedAt: ISODate
}
```

**Indexes:**
```javascript
db.content.createIndex({ key: 1 }, { unique: true })
```

**Notes:**
- This collection is a nice-to-have. The simpler approach is reading from a file (`content/knowledge-base.md`). The collection exists so the admin dashboard could theoretically have a "content editor" tab [VENEER].
- On startup, the app reads from this collection (or falls back to the file).
- For the demo, content is seeded via a script that reads the markdown file and inserts it.

---

## Seed Script

A script (`scripts/seed.ts`) will:
1. Connect to MongoDB
2. Insert the knowledge base content into `content` collection
3. Optionally insert 5-10 fake conversations and 3-5 fake leads so the admin dashboard isn't empty on first demo load
4. Print confirmation

Run: `npm run seed` or `docker compose exec app npx tsx scripts/seed.ts`
