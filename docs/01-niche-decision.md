# 01 — Niche Decision

## Options Evaluated

| Option | Company | Pitch | Chatbot Fit | Content Complexity | Lead Capture Fit |
|--------|---------|-------|-------------|-------------------|-----------------|
| A: B2B SaaS | SyncFlow | Automated remote team onboarding | Technical depth, but risks hallucination on feature specs | Medium — needs precise feature docs | Decent — HR lead capture |
| B: Corporate Events | Elevate Offsites | High-end corporate retreats | Excellent — conversational, visual, relatable | Low — packages, venues, logistics | Excellent — budget/headcount/email flow |
| C: Legal Tech | LexReview | AI contract analysis for real estate | Shows precision, but legal claims risky in demo | High — legal accuracy matters | Moderate — enterprise sales cycle |

## Decision: Option B — Elevate Offsites

**Proposed by:** GEMINI-LEAD (Round 1)
**Confirmed by:** OPUS-BUILD (Round 1)

### Why It Works

1. **Low hallucination risk.** Corporate events content is qualitative (venue descriptions, package features, logistics). There are no hard technical specs or legal claims where an LLM mistake looks catastrophic. If the bot slightly embellishes a venue description, it still reads as marketing copy. If a legal-tech bot gets a contract clause wrong, the demo feels broken.

2. **Natural conversation flow.** The sales motion maps perfectly to a chat conversation:
   - User asks about retreat options → bot describes packages
   - Bot asks qualifying questions (headcount, budget, dates) → feels natural, not forced
   - Bot offers to "send a custom proposal" → captures email
   - This is exactly the flow the client wants to see.

3. **Compact content set.** 4 pages + 12-15 FAQs ≈ 2,500-3,000 tokens. Fits entirely in the system prompt. No RAG infrastructure needed.

4. **Visually appealing.** Corporate retreat imagery makes the landing page look premium with minimal effort. Stock photos of mountain lodges and conference rooms sell themselves.

5. **Relatable to any client.** Every company does offsites. The prospect watching the demo will intuitively understand the product without explanation.

### Risk: "It's just a brochure bot"

The main risk is that a corporate events chatbot feels too simple — just answering FAQ questions. Mitigation: the lead qualification flow (asking budget, headcount, dates, then capturing email) demonstrates the bot doing real work, not just regurgitating text. The admin dashboard showing captured leads closes the loop.

### Rejected: Option A (B2B SaaS)

SyncFlow would require writing believable technical documentation for a fake product with fake integrations. If someone asks "does SyncFlow integrate with Jira?" and the bot answers wrong (or right about something that doesn't exist), the demo feels synthetic. The content burden is higher and the hallucination risk is worse.

### Rejected: Option C (Legal Tech)

LexReview sounds impressive but is dangerous for a demo. Any legal claim the bot makes gets scrutinized. "Can it actually analyze contracts?" — no, and that gap is immediately obvious. The precision requirement works against us when the bot is fictional.
