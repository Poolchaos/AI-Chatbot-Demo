# 07 - Docker Compose Architecture

## Services

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/elevate-offsites
      - LLM_PROVIDER=gemini
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - NODE_ENV=production
      - DAILY_REQUEST_LIMIT=1500
      - DEMO_MODE=true
    depends_on:
      mongo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

volumes:
  mongo_data:
```

## Design Decisions

### Two services only: `app` + `mongo`

No nginx reverse proxy. No Redis. No vector database. No separate worker.

- **No nginx:** Next.js handles its own HTTP serving fine for a demo with <10 concurrent users. If we need HTTPS for the demo, we'll use Caddy as a one-line addition, but for private server demo it's not needed.
- **No Redis:** Session state is in MongoDB. Token counters are in MongoDB with atomic `$inc`. We don't have the traffic to justify a caching layer.
- **No vector DB:** Full context injection, not RAG. No Chroma, no Pinecone, no pgvector.
- **No worker:** All processing is synchronous in API routes. No background job queue needed.

### Dockerfile (Next.js)

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/content ./content
COPY --from=builder /app/scripts ./scripts
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Multi-stage build. Final image is ~150MB (Alpine + Node + Next.js standalone). The `content/` directory is copied so the knowledge base file is available at runtime.

### MongoDB Init Script

`scripts/mongo-init.js` runs on first container start:

```javascript
db = db.getSiblingDB('elevate-offsites');

// Create collections with validation
db.createCollection('conversations');
db.createCollection('leads');
db.createCollection('token_usage');
db.createCollection('content');

// Indexes
db.conversations.createIndex({ sessionId: 1 }, { unique: true });
db.conversations.createIndex({ createdAt: -1 });
db.conversations.createIndex({ leadCaptured: 1, createdAt: -1 });

db.leads.createIndex({ email: 1 });
db.leads.createIndex({ createdAt: -1 });
db.leads.createIndex({ sessionId: 1 });

db.token_usage.createIndex({ date: 1 }, { unique: true });

db.content.createIndex({ key: 1 }, { unique: true });
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `LLM_PROVIDER` | Yes | `gemini` | `gemini` or `claude` |
| `GEMINI_API_KEY` | If provider=gemini | - | Google AI Studio API key |
| `CLAUDE_API_KEY` | If provider=claude | - | Anthropic API key |
| `DAILY_REQUEST_LIMIT` | No | `1500` | Max LLM API requests per day |
| `NODE_ENV` | No | `production` | Node environment |
| `SESSION_MESSAGE_LIMIT` | No | `20` | Max messages per chat session |
| `DEMO_MODE` | No | `false` | Set to `true` to enable `POST /api/admin/reset` in production |

### Secrets Management

For the demo:
- `.env` file in project root (gitignored)
- Docker Compose reads from `.env` automatically
- API keys are the only real secrets

### Runtime vs Build-Time Variables (Confirmed - Round 8)

**ZERO `NEXT_PUBLIC_` variables in this project.** The frontend communicates with the backend via relative API routes (`/api/chat`, `/api/admin/*`) - no hardcoded URLs needed.

All secrets (`GEMINI_API_KEY`, `CLAUDE_API_KEY`, `MONGODB_URI`, `DEMO_MODE`, `LLM_PROVIDER`) are server-side only. They are passed via the `environment` block in `docker-compose.yml` at container startup. They are **never** present during the `npm run build` step in the Dockerfile.

The `builder` stage in the Dockerfile has zero `ARG` or `ENV` declarations for secrets. No API key touches an image layer.

---

### .dockerignore (Required)

```
node_modules
.next
.env
.git
```

Without `.dockerignore`, the build context sent to Docker includes `node_modules` (~300MB+) and the host's `node_modules` will conflict with `npm ci` inside the container.

---

### Docker Dry Run Checklist (Round 8)

```bash
# 1. Clean Next.js cache (prevents stale build artifacts)
rm -rf .next

# 2. Verify standalone output is enabled
grep -q "output.*standalone" next.config.js && echo "✓ standalone" || echo "✗ MISSING"

# 3. Verify .dockerignore exists
test -f .dockerignore && echo "✓ .dockerignore" || echo "✗ MISSING"

# 4. Verify .env file exists with required keys
test -f .env && echo "✓ .env" || echo "✗ MISSING"

# 5. Build and run
docker compose up --build -d

# 6. Watch logs for startup errors
docker compose logs -f app

# 7. Verify health endpoint
curl -s http://localhost:3000/api/health | jq .
```

---

### Production Deployment with Caddy (Locked - Round 9)

**Caddyfile:**
```
yourdomain.com {
    reverse_proxy app:3000
}
```

**docker-compose.prod.yml** (overlay for production HTTPS):
```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
    depends_on:
      - app

volumes:
  caddy_data:
```

**Run command:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Caddy auto-provisions a Let's Encrypt HTTPS certificate. Zero manual steps. The base `docker-compose.yml` stays clean for local dev.

---

### Seed Script in Docker (Locked - Round 9)

The standalone Next.js build does not support `npm run seed` inside the container (no `node_modules/.bin` in PATH). Use:

```bash
docker compose exec app node scripts/seed.js
```

**Dockerfile change required** (runner stage - deployment config, not feature code):
```dockerfile
COPY --from=builder /app/scripts ./scripts
```

This copies the seed script into the final image so it's accessible at runtime.

```bash
# .env (not committed)
GEMINI_API_KEY=AIza...
CLAUDE_API_KEY=sk-ant-...
```

For production (out of scope for demo): Docker secrets or a vault.

---

## Startup Sequence

```bash
# One command to demo-ready
docker compose up --build -d

# Seed the database (first time only)
docker compose exec app npx tsx scripts/seed.ts

# Verify
curl http://localhost:3000/api/health
# → {"status":"ok","mongo":"connected","llm":"gemini","dailyRequests":0}
```

### Health Check Endpoint

`GET /api/health` returns:
```json
{
  "status": "ok",
  "mongo": "connected",
  "llm": "gemini",
  "dailyRequests": 42,
  "dailyLimit": 1500,
  "uptime": 3600
}
```

This lets us verify the system is working before the demo starts.

---

## Demo Day Checklist

1. `docker compose up --build -d` - build and start
2. Wait for health check to pass: `curl localhost:3000/api/health`
3. Run seed script if DB is empty: `docker compose exec app npx tsx scripts/seed.ts`
4. Open `http://server-ip:3000` - landing page with chat widget
5. Open `http://server-ip:3000/admin` - dashboard
6. Send a test message through the chat widget
7. Verify the conversation appears in admin dashboard
8. Verify token usage counter incremented
9. Run through a full lead capture flow
10. Verify the lead appears in admin leads tab
