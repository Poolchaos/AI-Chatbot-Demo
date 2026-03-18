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

## Admin Dashboard

Navigate to `/admin/login` and enter any password (demo auth). Dashboard provides:

- **Overview** - Stats cards + token usage gauge + 7-day history
- **Conversations** - Paginated list with detail view
- **Leads** - Captured leads with status management
- **Settings** - Demo data reset
