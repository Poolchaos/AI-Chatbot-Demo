# 10 — Content Plan

## Knowledge Base Structure

All chatbot content lives in a single file: `content/knowledge-base.md`

This file is injected verbatim into the system prompt on every request. Target: **~2,500 tokens** (~1,800 words). Actual (Round 3): **~3,200 tokens** (~2,300 words) — includes company info, packages, pricing rules, venue regions, 12 FAQs, and scope boundaries. Still within budget.

---

## Content Assignments

| Section | Description | Owner | Target Words | Priority |
|---------|-------------|-------|-------------|----------|
| Company Overview | Elevate Offsites mission, founded 2019, headquartered in Austin TX, 200+ events delivered | GEMINI-LEAD | 150 | High |
| Retreat Packages | 3 packages: Urban Experience, Nature Retreat, Executive Summit — each with description, capacity, inclusions | GEMINI-LEAD | 300 | High |
| Pricing | **LOCKED (Round 2).** Urban: $300/person. Nature: $450/person. Executive: flat $15,000 (up to 15 people). Over 100 headcount → custom enterprise pricing. Must match pricing page exactly. | GEMINI-LEAD | 150 | High |
| Locations | 4-5 fictional venue partnerships with brief descriptions | GEMINI-LEAD | 200 | Medium |
| FAQ — General | 5 questions: booking process, lead times, cancellation, what's included, customization | OPUS-BUILD | 250 | High |
| FAQ — Logistics | 4 questions: transportation, dietary needs, accessibility, weather contingency | OPUS-BUILD | 200 | High |
| FAQ — Pricing & Payment | 3 questions: deposits, payment methods, group discounts | OPUS-BUILD | 150 | High |
| About Page Copy | Company story, team, values (for website, also indexed by chatbot) | OPUS-BUILD | 150 | Low |
| Testimonials | 3 fake testimonials with names/companies (website only, not in chatbot KB) | GEMINI-LEAD | 100 | Low |

**Total target: ~1,650 words ≈ ~2,200 tokens**

Leaves ~300 token buffer in the knowledge base allocation.

---

## FAQ Questions (Draft)

### General (OPUS-BUILD)
1. How do I book a corporate retreat with Elevate Offsites?
2. How far in advance should I book?
3. What is your cancellation policy?
4. What's included in each retreat package?
5. Can I customize a package to fit our team's needs?

### Logistics (OPUS-BUILD)
6. Do you arrange transportation to the venue?
7. Can you accommodate dietary restrictions and allergies?
8. Are your venues accessible for people with disabilities?
9. What happens if there's bad weather during an outdoor retreat?

### Pricing & Payment (OPUS-BUILD)
10. What is the deposit requirement?
11. What payment methods do you accept?
12. Do you offer discounts for larger groups?

### Additional (can be added if token budget allows)
13. What is the typical group size you work with?
14. Do you provide team-building facilitators?
15. Can we bring our own speakers or trainers?

---

## Content Guidelines

- **Be specific with numbers.** Don't say "competitive pricing" — say "$150 per person for the Urban Experience (minimum 20 guests)." The chatbot needs concrete facts to avoid guessing.
- **Be consistent.** If the pricing page says $150, the knowledge base must say $150. The chatbot will be tested for inconsistency.
- **Avoid ambiguity.** Don't say "various locations" — name them. Don't say "flexible scheduling" — state the booking lead time.
- **No jargon.** The chatbot's audience is HR managers and office managers, not event industry professionals.
- **Include boundaries.** State what Elevate Offsites does NOT do (e.g., "We specialize in corporate events for groups of 15-200. We do not organize personal celebrations or weddings."). This helps the chatbot say "no" cleanly.

---

## Content Delivery Schedule

| Day | Deliverable | Owner | Status |
|-----|-------------|-------|--------|
| Day 1 | Full knowledge base first draft (`content/knowledge-base.md`) | GEMINI-LEAD (packages, pricing, locations) + OPUS-BUILD (FAQs) | ✅ DELIVERED (Round 3) |
| Day 2 | Review and finalize — ensure pricing consistency, no ambiguity | Both | Pending |
| Day 3 | Test with live chatbot, note where bot answers poorly | OPUS-BUILD | Pending |
| Day 6 | Content v2 — fix gaps found in testing | Both | Pending |
