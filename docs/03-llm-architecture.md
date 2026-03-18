# 03 — LLM Architecture

## Provider Decision

### Primary: Gemini 2.0 Flash (Free Tier)

**Model:** `gemini-2.0-flash`

**Known free tier limits (as of March 2026):**

| Metric | Limit | Source |
|--------|-------|--------|
| Requests per minute | 15 RPM | Google AI Studio docs |
| Tokens per minute | 1,000,000 TPM | Google AI Studio docs |
| Requests per day | 500-1,500 RPD (fluctuates by regional routing) | GEMINI-LEAD verification + community reports |

**Status: ✅ CONFIRMED (Round 4).** GEMINI-LEAD independently verified limits. Even worst-case 500 RPD gives ~50 full conversations/day — more than enough for testing and live demo. Day 1 gate test passed. Proceeding with Gemini as primary.

**Why Gemini for a demo:**
- 15 RPM is more than enough (demo will have 1-3 concurrent users max)
- 1,500 RPD covers ~100-150 full conversations per day (10-15 messages each)
- Streaming supported via `generateContentStream`
- Function calling supported natively
- Quality for conversational Q&A with grounded content: good. Flash is optimized for speed, not depth — perfect for a chatbot that answers from provided context.

**SDK:** `@google/generative-ai` (official Node.js SDK)

### Fallback: Claude 3.5 Haiku

**Model:** `claude-3-5-haiku-20241022` (or latest available)

**Verified pricing (March 2026, confirmed by GEMINI-LEAD):**

| Metric | Cost |
|--------|------|
| Input tokens | $0.80 / 1M tokens |
| Output tokens | $4.00 / 1M tokens |

**Cost projection per conversation:**
- System prompt + content: ~3,000 input tokens
- 10-message conversation: ~2,000 input tokens (history) + ~2,000 output tokens
- Per conversation: ~5,000 input + ~2,000 output
- Cost: (5,000 × $0.80 / 1M) + (2,000 × $4.00 / 1M) = $0.004 + $0.008 = **~$0.014 per conversation**
- 100 demo conversations = **$1.40**
- Acceptable as fallback budget

**SDK:** `@anthropic-ai/sdk` (official Node.js SDK)

**Why Claude as fallback, not as primary:**
- Costs money (even if pennies)
- Haiku quality for grounded Q&A is comparable to Gemini Flash
- Both support streaming and function calling
- If Gemini free tier works, no reason to pay

### Provider Abstraction

We will build a thin abstraction layer so the API route doesn't care which provider it's calling:

```typescript
interface LLMProvider {
  streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
  }): AsyncGenerator<StreamChunk>;
}
```

Implementations: `GeminiProvider` and `ClaudeProvider`. Swap via environment variable `LLM_PROVIDER=gemini|claude`. This takes ~2 hours but saves us if Gemini fails on demo day.

---

## Content Retrieval Strategy

### Decision: Full Context Injection (No RAG)

**Agreed by both GEMINI-LEAD and OPUS-BUILD.**

**Why not RAG:**
- Total content is ~2,500-3,000 tokens (4 pages + 15 FAQs)
- This fits comfortably in the system prompt alongside persona instructions
- Vector embeddings + vector DB (Pinecone/Chroma/pgvector) adds:
  - Another service in Docker Compose
  - Embedding pipeline code
  - Retrieval logic
  - Relevance tuning
  - ~8-10 hours of work for zero demo benefit
- RAG solves the problem of "too much content to fit in context." We don't have that problem.

**How it works:**
1. All content lives in a single file: `content/knowledge-base.md`
2. On app startup, this file is loaded into memory
3. On every API request, the full content is injected into the system prompt
4. The LLM sees everything and answers from it

**Token budget per request:**

| Component | Estimated Tokens |
|-----------|-----------------|
| System prompt (persona + rules) | ~1,000 |
| Knowledge base content | ~3,200 |
| Conversation history (last 10 exchanges) | ~2,000 |
| **Total input** | **~6,200** |
| Response (estimated) | ~300-500 |
| **Total per request** | **~6,700** |

At ~6,700 tokens per request and 10 messages per conversation, one conversation uses ~67,000 tokens. Well within the 1M TPM Gemini limit.

**Content update process:**
1. Edit `content/knowledge-base.md`
2. Restart the Next.js server (or implement a file watcher that reloads on change — stretch goal)
3. No re-indexing, no re-embedding, no pipeline

**When this approach breaks (not relevant for demo):**
- Content exceeds ~8,000 tokens (30+ pages) → need chunking or RAG
- Multiple distinct knowledge domains → need retrieval to select relevant chunks
- Content changes frequently from external sources → need ingestion pipeline

None of these apply to our demo.

---

## Function Calling Stream Behavior (Locked — Round 6)

This is the most complex interaction in the pipeline. Here's exactly what happens when the LLM decides to call `save_lead`:

### The Problem

Gemini (and Claude) function calling with streaming works in two phases:
1. The LLM generates text AND a tool call in the same response
2. The LLM expects you to execute the tool and return the result
3. The LLM then generates a final response incorporating the tool result

This is a multi-turn tool-use loop. For our demo, we **short-circuit it**.

### Our Approach: Single-Turn Tool Execution (No Round-Trip)

We do NOT send the tool result back to the LLM for a second generation. Why:
- Adds a second LLM call per lead capture (doubles latency, doubles tokens)
- The LLM's "confirmation" message is predictable — we can generate it from the system prompt
- The user doesn't need the LLM to confirm; a clean backend confirmation is better

**Flow:**

```
User: "My email is client@test.com, budget is $20k"
                    │
                    ▼
    ┌─ /api/chat receives message ─┐
    │                               │
    │  1. Load conversation history │
    │  2. Build prompt + KB         │
    │  3. Call Gemini streamChat()  │
    └───────────────────────────────┘
                    │
                    ▼
    ┌─ Gemini streams response ────┐
    │                               │
    │  Chunks: "I've passed your    │
    │  details to our events team.  │
    │  They'll reach out to         │
    │  **client@test.com** within   │
    │  24 hours."                   │
    │                               │
    │  + tool_call: save_lead({     │
    │      email: "client@test.com",│
    │      budget_range: "$20k",    │
    │      estimated_headcount: 50, │
    │      event_type: "Nature"     │
    │  })                           │
    └───────────────────────────────┘
                    │
                    ▼
    ┌─ Backend processes stream ───┐
    │                               │
    │  1. Stream text chunks to     │
    │     client as they arrive     │
    │     (type: "text")            │
    │                               │
    │  2. When tool_call detected:  │
    │     - Extract arguments       │
    │     - Validate email          │
    │     - Dedup check (session)   │
    │     - Insert into leads       │
    │     - Emit lead_saved chunk   │
    │                               │
    │  3. Emit done chunk with      │
    │     token usage               │
    │                               │
    │  4. Do NOT call Gemini again  │
    └───────────────────────────────┘
```

### What the Frontend Sees

The frontend experiences **zero pause**. The sequence is:

1. `text` chunks stream in smoothly (the LLM's natural response)
2. After the last `text` chunk, a `lead_saved` chunk arrives (~50ms delay for the MongoDB write)
3. `done` chunk closes the stream

The DB write happens server-side in parallel with the final text chunks being flushed to the client. The user perceives no delay. The `lead_saved` event arrives as a metadata postscript.

### Edge Case: LLM Calls Tool Without Text

Rare, but possible — the LLM might emit only a tool call with no text. In this case:
1. Backend detects tool_call with no preceding text
2. Backend manually injects a `text` chunk: `"I've noted your details. Our events team will reach out within 24 hours."`
3. Then emits `lead_saved` + `done` as normal

The frontend never receives a `lead_saved` without at least one `text` chunk preceding it.

---

## Token Management Architecture

### Per-Request Tracking

Every LLM API call returns token usage metadata:
- `prompt_tokens` (input)
- `completion_tokens` (output)
- `total_tokens`

Our API route extracts these from the response and:
1. Appends to the conversation document in MongoDB
2. Increments the daily counter in the `token_usage` collection
3. Returns token count in response headers (`X-Tokens-Used`, `X-Daily-Remaining`)

### Session Limits

| Limit | Value | Action |
|-------|-------|--------|
| Max messages per session | 20 | Bot says: "I've really enjoyed our conversation! To continue, let me connect you with our events team. What's the best email to reach you?" |
| Max tokens per session | 100,000 | Same as above |

The session limit doubles as a lead capture trigger. When the user hits 20 messages, they're engaged — perfect time to push for email.

**Enforcement: 100% backend.** The API route checks `conversation.messageCount` at the start of every request. If >= 20, the backend returns an `error` SSE chunk with `code: "SESSION_LIMIT"` immediately — no LLM call is made. The frontend does NOT need to track message counts or block the input UI. The backend handles it entirely.

Flow when limit is hit:
1. User sends message 21
2. Backend loads conversation from MongoDB, sees `messageCount >= 20`
3. Backend returns: `data: {"type":"error","message":"I've really enjoyed our conversation!...","code":"SESSION_LIMIT"}`
4. Frontend renders the message as a normal assistant response
5. Input remains enabled (user can still type their email, which triggers a final lead capture attempt)

### Daily Global Limits (Gemini Free Tier)

| Threshold | % of Daily Limit | Action |
|-----------|------------------|--------|
| Normal | 0-80% (0-1,200 requests) | Normal operation |
| Warning | 80-95% (1,200-1,425 requests) | Responses include: "We're experiencing high demand today. I'm still here to help!" (logged to admin dashboard) |
| Degraded | 95-100% (1,425-1,500 requests) | Shorter responses. System prompt adds: "Keep responses under 50 words. Prioritize directing users to leave contact info." |
| Blocked | 100%+ | No LLM call. Return static message: "Our AI assistant is currently resting for the day. Please leave your name and email, and our events team will reach out within 24 hours." Lead capture form appears in chat. |

### Counter Implementation

```
Collection: token_usage
Document (one per day):
{
  date: "2026-03-20",           // partition key
  total_requests: 342,
  total_input_tokens: 1800000,
  total_output_tokens: 450000,
  total_tokens: 2250000,
  updated_at: ISODate(...)
}
```

- Upserted on every request via `$inc` (atomic, no race conditions)
- Queried at the start of every request to check limits
- No cron job needed — new day = new document (keyed by date string)
- TTL index on `updated_at` to auto-delete after 90 days

### Dashboard Display

The admin dashboard shows:
- Today's request count / daily limit (bar or gauge)
- Today's token usage (input + output)
- 7-day usage chart (real data if enough conversations, seeded if not)

---

## Streaming Implementation

### Server → Client Protocol

Using Server-Sent Events (SSE) over a POST request (not WebSocket — simpler, works through proxies).

**Request:** `POST /api/chat`
```json
{
  "sessionId": "uuid-v4",
  "message": "What retreat packages do you offer?"
}
```

**Response:** `Content-Type: text/event-stream`

### SSE Chunk Schema (EXACT — parse against these)

Every line in the stream follows the format `data: <JSON>\n\n`. The JSON always has a `type` field. There are exactly 5 chunk types:

#### 1. `text` — Streamed content token
```json
{"type": "text", "content": "We"}
```
- `content`: string — a fragment of the assistant's response (1-5 tokens worth of text)
- **Action:** Append `content` to the current assistant message buffer. Render with `react-markdown`.
- **Frequency:** Many per response (typically 30-100 chunks per message)

#### 2. `lead_saved` — Lead capture confirmation
```json
{"type": "lead_saved", "leadId": "6604a3f2e1b2c3d4e5f60001"}
```
- `leadId`: string — MongoDB ObjectId of the saved lead document
- **Action:** Set `leadSaved = true` in ChatProvider context. Trigger the green "Verified Lead" badge / header pulse.
- **Frequency:** 0 or 1 per response. Only emitted when the `save_lead` function call executes successfully.
- **Timing:** Emitted AFTER all `text` chunks for the response. The user sees the full confirmation message ("I've noted that down...") before this meta-event fires.

#### 3. `done` — Stream complete
```json
{"type": "done", "usage": {"prompt_tokens": 5400, "completion_tokens": 280, "total_tokens": 5680}, "sessionMessageCount": 6}
```
- `usage.prompt_tokens`: number — input tokens for this request
- `usage.completion_tokens`: number — output tokens generated
- `usage.total_tokens`: number — sum
- `sessionMessageCount`: number — total messages in this session (user + assistant). Use this to show a subtle counter if desired.
- **Action:** Mark `isStreaming = false`. Optionally display token usage in debug mode.
- **Frequency:** Exactly 1, always the final chunk in a successful stream.

#### 4. `error` — Server-side error
```json
{"type": "error", "message": "I had a brief hiccup. Could you repeat that?", "code": "LLM_TIMEOUT"}
```
- `message`: string — user-facing error message (safe to render directly in chat)
- `code`: string — machine-readable error code for logging. One of: `LLM_TIMEOUT`, `LLM_ERROR`, `RATE_LIMITED`, `SESSION_LIMIT`, `DAILY_LIMIT`
- **Action:** Display `message` as an assistant message. Set `isLoading = false`, `isStreaming = false`.
- **Frequency:** 0 or 1. If present, no `done` chunk follows.

#### 5. `limit_warning` — Approaching limits
```json
{"type": "limit_warning", "kind": "daily", "percentUsed": 85.3}
```
- `kind`: `"daily"` | `"session"` — which limit is being approached
- `percentUsed`: number — percentage of the limit consumed
- **Action:** Optional UI indicator. Could be ignored entirely for the demo — the backend handles degradation.
- **Frequency:** 0 or 1, emitted before `text` chunks if applicable.

### Full Stream Example (Normal Response)
```
data: {"type":"text","content":"The "}
data: {"type":"text","content":"**Nature "}
data: {"type":"text","content":"Package** "}
data: {"type":"text","content":"includes "}
data: {"type":"text","content":"venue hire, "}
data: {"type":"text","content":"catering, and transport."}
data: {"type":"done","usage":{"prompt_tokens":5400,"completion_tokens":42,"total_tokens":5442},"sessionMessageCount":4}
```

### Full Stream Example (With Lead Capture)
```
data: {"type":"text","content":"I've "}
data: {"type":"text","content":"passed your details "}
data: {"type":"text","content":"to our events team. "}
data: {"type":"text","content":"They'll reach out to "}
data: {"type":"text","content":"**client@test.com** "}
data: {"type":"text","content":"within 24 hours."}
data: {"type":"lead_saved","leadId":"6604a3f2e1b2c3d4e5f60001"}
data: {"type":"done","usage":{"prompt_tokens":6100,"completion_tokens":38,"total_tokens":6138},"sessionMessageCount":10}
```

### Full Stream Example (Session Limit Hit)
```
data: {"type":"error","message":"I've really enjoyed our conversation! To continue, let me connect you with our events team. What's the best email to reach you?","code":"SESSION_LIMIT"}
```

### Full Stream Example (Daily Limit Blocked)
```
data: {"type":"error","message":"Our AI assistant is currently resting for the day. Please leave your name and email, and our events team will reach out within 24 hours.","code":"DAILY_LIMIT"}
```

### Parser Pseudocode (for useChat hook)
```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';  // keep incomplete line in buffer
  
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const json = JSON.parse(line.slice(6));
    
    switch (json.type) {
      case 'text':
        appendToCurrentMessage(json.content);
        setIsStreaming(true);
        setIsLoading(false);
        break;
      case 'lead_saved':
        setLeadSaved(true);
        break;
      case 'done':
        setIsStreaming(false);
        setTokenUsage(json.usage);
        break;
      case 'error':
        appendAssistantMessage(json.message);
        setIsLoading(false);
        setIsStreaming(false);
        break;
      case 'limit_warning':
        // optional: show indicator
        break;
    }
  }
}
```

---

## Conversation History Management

### Context Window Strategy

Each request sends the last **10 user-assistant exchange pairs** (20 messages) to the LLM. This provides sufficient context for multi-turn conversation while keeping input tokens predictable.

**Trimming logic:**
```
if (history.length > 20) {
  history = history.slice(-20);
}
```

Always keep the system prompt. Always keep the most recent messages. Old messages drop off the front.

### Why Not Summarization

Some chatbots summarize old messages to compress history. For our demo:
- Conversations are short (10-20 messages max before session limit)
- Summarization adds an extra LLM call per request (doubles cost, adds latency)
- The full 20-message history fits in budget
- Not worth the complexity
