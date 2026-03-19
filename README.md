# Elevate Offsites - AI Chatbot Demo

An AI-powered sales chatbot for a premium corporate retreat business. Built with Next.js, MongoDB, and LLM integration (Google Gemini / Anthropic Claude).

## Features

- **AI Chat Widget** - Floating chat bubble with SSE streaming, markdown rendering, and lead capture via function calling
- **Landing Page** - Hero, features, pricing packages, testimonials
- **Admin Dashboard** - Conversations, leads, token usage monitoring, demo reset
- **Lead Capture** - Automatic extraction of contact info via LLM tool use
- **Token Management** - 4-tier daily limit system (normal → warning → degraded → blocked)
- **Docker Ready** - Multi-stage Dockerfile + docker-compose with MongoDB

## Quick Start

### Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)
- API key for Google Gemini or Anthropic Claude

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys and MongoDB URI

# Seed demo data
npm run seed

# Start development server
npm run dev
```

### Docker

```bash
# Set your API key
export GEMINI_API_KEY=your-key-here

# Start everything
docker compose up --build
```

The app will be available at http://localhost:3000.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/elevate-offsites` | MongoDB connection string |
| `LLM_PROVIDER` | `gemini` | LLM provider (`gemini` or `claude`) |
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `ANTHROPIC_API_KEY` | - | Anthropic Claude API key |
| `DAILY_REQUEST_LIMIT` | `100` | Max API requests per day |
| `SESSION_MESSAGE_LIMIT` | `20` | Max messages per chat session |
| `NODE_ENV` | `development` | Environment |
| `DEMO_MODE` | `false` | Enable demo reset endpoint |

## Architecture

```
app/
  page.tsx              # Landing page
  layout.tsx            # Root layout with ChatProvider
  api/
    chat/route.ts       # SSE streaming chat endpoint
    health/route.ts     # Health check
    admin/              # Admin API routes
  admin/                # Admin dashboard pages
components/
  chat-window.tsx       # Chat widget UI
  chat-bubble.tsx       # Floating chat button
  chat-provider.tsx     # Chat context provider
  landing-page.tsx      # Landing page sections
hooks/
  use-chat.ts           # Custom SSE chat hook
lib/
  db.ts                 # MongoDB connection
  types.ts              # TypeScript types
  prompt.ts             # System prompt + tool definitions
  token-manager.ts      # Daily limit tracking
  llm/                  # LLM provider abstraction
scripts/
  seed.ts               # Demo data seeder
  mongo-init.js         # MongoDB indexes
```

## Testing

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

## Testing the Chatbot

Use these example questions to exercise the AI chatbot's knowledge and capabilities:

### Packages & Pricing
- "What packages do you offer for corporate retreats?"
- "What's the difference between the Essential and Signature packages?"
- "Do you have options for a team of 50 people?"
- "What's included in the Summit package?"

### Destinations & Venues
- "What destinations do you recommend for a winter retreat?"
- "Do you offer retreats in Cape Town?"
- "What are your most popular retreat locations?"
- "Can you suggest a venue with outdoor adventure activities?"

### Logistics & Planning
- "How far in advance should we book a retreat?"
- "What does the planning process look like?"
- "Do you handle travel arrangements and accommodation?"
- "Can you accommodate dietary restrictions?"

### Team Building & Activities
- "What kind of team building activities do you offer?"
- "Do you have options for remote teams meeting in person for the first time?"
- "What activities work best for leadership development?"
- "Can you include wellness activities in our retreat?"

### Budget & ROI
- "How do I justify the cost of a retreat to my CFO?"
- "What ROI can we expect from a corporate offsite?"
- "Do you offer payment plans?"
- "What's the typical cost per person for a 3-day retreat?"

### Blog & Industry Insights
- "What tips do you have for planning a successful offsite?"
- "Tell me about the future of corporate retreats"
- "Do you have any case studies or success stories?"
- "What are the latest trends in team building?"

### Lead Capture (triggers contact form)
- "I'd like to book a retreat for 30 people in March"
- "Can someone call me to discuss options? My number is 555-0100"
- "I'm interested — my email is test@example.com"

### Out-of-Scope (should politely redirect)
- "What's the weather like today?"
- "Can you help me write a Python script?"
- "Tell me a joke"

## Admin Dashboard

Navigate to `/admin/login` and enter any password (demo auth). Dashboard provides:

- **Overview** - Stats cards + token usage gauge + 7-day history
- **Conversations** - Paginated list with detail view
- **Leads** - Captured leads with status management
- **Settings** - Demo data reset
