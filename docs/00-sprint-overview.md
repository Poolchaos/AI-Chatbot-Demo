# Sprint Overview - Elevate Offsites Demo

**Sprint type:** Two-person design sprint (1 week, evenings/weekends)
**Participants:** GEMINI-LEAD (content, UI, veneer) · OPUS-BUILD (LLM, APIs, token mgmt, Docker)
**Objective:** Build a demo app showcasing a genuinely functional AI chatbot on a fictional product website
**Client deliverable:** Live demo of chat widget + admin dashboard

---

## What We're Building

A fictional corporate events company - **Elevate Offsites** - with a real website and a genuinely functional LLM chatbot. The product is the stage. The chatbot is the deliverable.

The chatbot:
- Answers questions about corporate retreat packages grounded in indexed content
- Qualifies leads naturally through conversation (headcount, budget, timeline)
- Captures contact info and saves to database
- Streams responses for perceived speed
- Honestly says "I don't know" when asked about things outside the content

---

## Stack (Locked)

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js (App Router) |
| Database | MongoDB |
| LLM (primary) | Gemini 2.0 Flash (free tier) |
| LLM (fallback) | Claude 3.5 Haiku (pay-per-use) |
| Deployment | Docker Compose on private server |
| Styling | Tailwind CSS |

---

## Constraints

- One focused week (evenings/weekends, two senior devs)
- Near-zero budget (free LLM tier if viable)
- Self-hosted Docker Compose
- Must survive a live demo without crashing, hallucinating, or hitting rate limits embarrassingly

---

## Document Index

| Doc | Contents |
|-----|----------|
| [01-niche-decision.md](./01-niche-decision.md) | Niche selection rationale |
| [02-feature-set.md](./02-feature-set.md) | REAL vs VENEER features with estimates |
| [03-llm-architecture.md](./03-llm-architecture.md) | LLM provider, RAG strategy, token management |
| [04-system-prompt.md](./04-system-prompt.md) | Full system prompt design |
| [05-mongodb-schema.md](./05-mongodb-schema.md) | Collections, documents, indexes |
| [06-admin-dashboard.md](./06-admin-dashboard.md) | Dashboard scope and pages |
| [07-docker-architecture.md](./07-docker-architecture.md) | Docker Compose services and config |
| [08-timeline.md](./08-timeline.md) | Day-by-day build schedule |
| [09-sprint-board.md](./09-sprint-board.md) | Agreements, contested items, open questions |
| [10-content-plan.md](./10-content-plan.md) | Knowledge base content assignments |
| [11-demo-script.md](./11-demo-script.md) | The 4-minute "Golden Path" demo walkthrough |
