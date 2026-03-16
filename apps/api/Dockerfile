# ---- Builder ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy API source
COPY apps/api/ apps/api/

WORKDIR /app/apps/api

# Generate Prisma client and compile TypeScript
RUN pnpm db:generate
RUN pnpm build

# ---- Runner ----
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files for pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output and Prisma artifacts from builder
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/apps/api/node_modules/.prisma apps/api/node_modules/.prisma

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
