# --- Multi-Stage Dockerfile for CampusGrid Engine (NestJS Backend) ---

# 1. Base Setup
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# 2. Development & Testing Dependencies
FROM base AS dependencies
RUN npm ci
COPY . .
RUN npx prisma generate

# 3. Target Stage: Testing Environment
FROM dependencies AS testing-env
ENV NODE_ENV=development
ENV PORT=4000
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# 4. Production Builder
FROM dependencies AS builder
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build
RUN npm prune --production

# 5. Target Stage: Staging Environment
FROM base AS staging-env
ENV NODE_ENV=staging
ENV PORT=4000
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]

# 6. Target Stage: Production Environment
FROM base AS production-env
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
