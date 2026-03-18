# 11 — Demo Script ("The Golden Path")

## Overview

**Duration:** 4 minutes
**Audience:** Potential client evaluating our chatbot solution
**Goal:** Prove end-to-end value — from user landing on site → chatbot conversation → lead captured in admin dashboard

The demo follows a single continuous narrative. Every feature shown exists because this script requires it.

---

## The Script

### Step 1 — The Hook (30 seconds)

**Action:** Open the Elevate Offsites landing page in the browser. Scroll slowly past the hero section, through the feature grid, down to pricing.

**What it proves:**
- The product sits on a credible, professional website
- This isn't a prototype — it looks like a real company's site

**Talking point:** "This is a fictional corporate retreat company we built as a demo environment. The website is the stage — the chatbot is what we're here to show you."

---

### Step 2 — The Opener (20 seconds)

**Action:** Click the floating chat widget button in the bottom-right corner. The widget slides up with animation. The bot instantly streams its greeting.

**Expected bot response:**
> "Welcome to Elevate Offsites! Are you planning a corporate retreat, or just exploring what we offer?"

**What it proves:**
- Low latency — time-to-first-token must be under 1 second
- Contextual greeting (not generic "How can I help you?")
- Streaming feels responsive and modern

**Demo risk:** Cold start latency on first request. **Mitigation:** Send a warm-up request when the page loads (hidden, before widget opens).

---

### Step 3 — The Test (45 seconds)

**Action:** Type: *"What is included in the Nature package, and how much is it for 20 people?"*

**Expected bot response (approximate):**
> The **Nature Package** includes venue hire, catering, ground transportation to the venue, and a guided outdoor activity.
>
> At **$450 per person**, a group of 20 would come to **$9,000** before any add-ons.
>
> Would you like to hear about customization options for your group?

**What it proves:**
- Bot answers ONLY from the knowledge base (grounded, no hallucination)
- Basic arithmetic from static pricing (20 × $450 = $9,000, shown explicitly)
- **Bold formatting** on package names and pricing (micro-formatting rule)
- Concise response — answers then asks, doesn't wall-of-text
- Pacing rule: answer block separate from follow-up question

**Demo risk:** Bot hallucinates an inclusion not in the knowledge base, or gets the math wrong. **Mitigation:** This exact question will be tested 10+ times during Day 6 prompt tuning.

---

### Step 4 — The Pivot (30 seconds)

**Action:** Type: *"Actually, we might have 50 people."*

**Expected bot response (approximate):**
> Great — 50 people opens up some wonderful possibilities with the **Nature Package**. That would be **$22,500** at our standard rate.
>
> Do you have a rough budget range in mind? That'll help me recommend the right setup.

**What it proves:**
- Multi-turn context: bot remembers the previous package discussion
- Updates its arithmetic (50 × $450 = $22,500)
- Natural qualification question (budget) woven into conversation
- Doesn't re-explain the package — builds on context

---

### Step 5 — Lead Capture (30 seconds)

**Action:** Type: *"Budget is around $20k. My email is client@test.com."*

**Expected bot response (approximate):**
> That's a solid budget for a group of 50. I've passed your details to our events team — they'll reach out to **client@test.com** within 24 hours with a tailored proposal for the **Nature Package**.
>
> Is there anything else you'd like to know in the meantime?

**What it proves:**
- Function calling fires silently (`save_lead` tool)
- Bot confirms the email naturally (no robotic "Your data has been saved")
- Lead includes: headcount (50), budget ($20k), event type (Nature), email
- Optional: subtle green checkmark or "Lead saved" indicator in chat header (UI enhancement)

**Demo risk:** Function calling doesn't trigger. **Mitigation:** The system prompt strongly prioritizes lead capture when email is provided. Tested in prompt tuning.

---

### Step 6 — The Reveal (45 seconds)

**Action:** Open a new browser tab. Navigate to `/admin`. Log in via the fake login screen. The dashboard loads.

**What to show:**
1. **Overview page:** Stat cards show today's conversation count (at least 1), lead count (at least 1)
2. **Leads tab:** The lead from Step 5 is in the table:
   - Email: client@test.com
   - Headcount: 150
   - Event Type: Nature Package
   - Status: New
3. **Conversations tab:** Click into the conversation — full chat history rendered with user/bot messages

**Talking point:** *"Where did that lead go? Here it is — pre-qualified with headcount and event type. And here is the exact transcript. Your sales team steps in with full context."*

**What it proves:**
- Real data flow: chat → MongoDB → admin dashboard
- Not mocked — the lead was just created 30 seconds ago
- The admin dashboard is a working tool, not a screenshot

**CRITICAL:** Do NOT reset before showing the dashboard. The live lead from Step 5 IS the proof. Only use the reset button if the client wants to try the flow themselves afterward.

---

## Pre-Demo Checklist

1. [ ] HTTPS cert verified (`curl -I https://yourdomain.com` returns 200, no warnings)
2. [ ] Health dot is GREEN (check landing page footer)
3. [ ] Warm-up request sent (page load triggers hidden API call)
4. [ ] Fresh browser session (no stale sessionId)
5. [ ] Admin dashboard open in a second tab (logged in via fake login, ready to refresh)
6. [ ] No existing conversation with "client@test.com" (or clear test data)
7. [ ] Verify token usage is well below daily limit
8. [ ] Test the exact messages above in sequence — confirm responses are acceptable
9. [ ] Have the fallback provider ready (`LLM_PROVIDER=claude`) if Gemini is flaky
10. [ ] Reset button tested — 5-click in admin footer fires, toast appears, data refreshes

## Features NOT in the Demo Script

These exist in the app but are NOT shown during the 4-minute demo. They exist for credibility if the client explores afterward:

- Pricing page (client may click around after demo)
- Session message limit / graceful degradation (only triggers at 20 messages)
- Token usage gauge in admin (visible but not called out)
- Admin settings page (exists but not navigated to)
- About page
