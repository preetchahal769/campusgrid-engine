# --- Multi-Stage Dockerfile for CampusGrid Engine (NestJS Backend) ---
# Two-server model: both staging and production use port 4000 cleanly.
# Backend secrets (DATABASE_URL, JWT_SECRET, etc.) are NEVER baked into
# the image — they are injected at runtime from .env files on each server.

# ─────────────────────────────────────────────────────────────────
# Stage 1 — Base: shared Alpine foundation + package manifests
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# ─────────────────────────────────────────────────────────────────
# Stage 2 — Dependencies: installs all deps (dev + prod) + generates
# the Prisma client from the schema
# ─────────────────────────────────────────────────────────────────
FROM base AS dependencies
RUN npm ci
COPY . .
RUN npx prisma generate

# ─────────────────────────────────────────────────────────────────
# Stage 3 — TARGET: testing-env
# Triggered on every push to main. Hot-reload dev server.
# Purpose: verify the image compiles and the watch server can start.
# ─────────────────────────────────────────────────────────────────
FROM dependencies AS testing-env
ENV NODE_ENV=development
ENV PORT=4000
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# ─────────────────────────────────────────────────────────────────
# Stage 4 — Builder: compiles TypeScript → dist/, prunes devDeps
# ─────────────────────────────────────────────────────────────────
FROM dependencies AS builder
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build
RUN npm prune --production

# ─────────────────────────────────────────────────────────────────
# Stage 5 — TARGET: staging-env
# Compiled NestJS app. Runs as non-root node user.
# Entrypoint runs prisma migrate deploy before booting the server.
# ─────────────────────────────────────────────────────────────────
FROM base AS staging-env
ENV NODE_ENV=staging
ENV PORT=4000
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
USER node
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]

# ─────────────────────────────────────────────────────────────────
# Stage 6 — TARGET: production-env
# Identical structure to staging — different runtime env file on server.
# Built from the exact same commit SHA as staging, after manual approval.
# ─────────────────────────────────────────────────────────────────
FROM base AS production-env
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
USER node
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
