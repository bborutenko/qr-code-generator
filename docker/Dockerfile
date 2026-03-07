# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# ── Stage 1: Install dependencies ────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args — passed via --build-arg or docker-compose build args
# These are needed at build time because Next.js validates env on startup
ARG HOVERCODE_WORKSPACE_ID
ARG HOVERCODE_API_KEY
ARG HOVERCODE_BASE_URL
ARG DATABASE_URL

ENV HOVERCODE_WORKSPACE_ID=$HOVERCODE_WORKSPACE_ID
ENV HOVERCODE_API_KEY=$HOVERCODE_API_KEY
ENV HOVERCODE_BASE_URL=$HOVERCODE_BASE_URL
ENV DATABASE_URL=$DATABASE_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]