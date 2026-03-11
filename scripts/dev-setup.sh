#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# ManufactureHub -- Local Development Setup
# =============================================================================
# Usage:  ./scripts/dev-setup.sh
#
# This script bootstraps everything you need to run the full stack locally:
#   1. Checks for required tools (node, pnpm, postgres)
#   2. Creates the local database if it doesn't exist
#   3. Copies .env files with dev defaults
#   4. Installs dependencies
#   5. Runs Prisma migrations
#   6. Seeds the database with realistic sample data
# =============================================================================

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

info()    { echo -e "${GREEN}[+]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
fail()    { echo -e "${RED}[x]${NC} $*"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo -e "  ${BOLD}ManufactureHub -- Local Dev Setup${NC}"
echo "  ================================="
echo ""

# ---------------------------------------------------------------------------
# 1. Check required tools
# ---------------------------------------------------------------------------
info "Checking required tools..."

# Node.js
if ! command -v node &>/dev/null; then
  fail "node is not installed. Install Node.js 18+ via https://nodejs.org or 'brew install node'"
fi
NODE_V=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_V" -lt 18 ]; then
  fail "Node.js 18+ required (found $(node -v))"
fi
info "node $(node -v)"

# pnpm
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found. Installing via corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
  if ! command -v pnpm &>/dev/null; then
    fail "Could not install pnpm. Install manually: npm install -g pnpm"
  fi
fi
info "pnpm $(pnpm -v)"

# PostgreSQL
if ! command -v psql &>/dev/null; then
  if [[ "$(uname)" == "Darwin" ]]; then
    info "PostgreSQL not found. Installing via Homebrew..."
    if ! command -v brew &>/dev/null; then
      fail "Homebrew not found. Install it first: https://brew.sh"
    fi
    brew install postgresql@16
    brew services start postgresql@16

    # Add to PATH for this session
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
    echo ""
    warn "PostgreSQL@16 installed. You may need to add this to your shell profile:"
    warn "  export PATH=\"/opt/homebrew/opt/postgresql@16/bin:\$PATH\""
    echo ""
  else
    fail "psql not found. Install PostgreSQL 16 for your platform."
  fi
fi
info "$(psql --version | head -1)"

echo ""

# ---------------------------------------------------------------------------
# 2. Create local database if it doesn't exist
# ---------------------------------------------------------------------------
info "Checking database..."

DB_NAME="manufacturehub"
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  info "Database '$DB_NAME' already exists"
else
  info "Creating database '$DB_NAME'..."
  createdb "$DB_NAME" 2>/dev/null \
    || createdb -U postgres "$DB_NAME" 2>/dev/null \
    || createdb -U "$(whoami)" "$DB_NAME" 2>/dev/null \
    || fail "Failed to create database '$DB_NAME'. Create it manually: createdb $DB_NAME"
  info "Database '$DB_NAME' created"
fi

echo ""

# ---------------------------------------------------------------------------
# 3. Copy .env files if they don't exist
# ---------------------------------------------------------------------------
info "Setting up environment files..."

# Root .env
if [ -f "$ROOT_DIR/.env" ]; then
  info ".env already exists (skipping)"
else
  if [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    info ".env copied from .env.example"
  else
    cat > "$ROOT_DIR/.env" << 'ENVEOF'
# Database
DATABASE_URL=postgresql://localhost:5432/manufacturehub
REDIS_URL=redis://localhost:6379

# Auth (Clerk) -- sign up at https://clerk.com for real keys
CLERK_PUBLISHABLE_KEY=pk_test_placeholder
CLERK_SECRET_KEY=sk_test_placeholder
CLERK_WEBHOOK_SECRET=whsec_placeholder

# Anthropic Claude API (optional for dev)
ANTHROPIC_API_KEY=sk-ant-placeholder

# App config
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3001
JWT_SECRET=local-dev-secret-change-in-production
CORS_ORIGINS=http://localhost:5173
ENVEOF
    info ".env created with dev defaults"
  fi
fi

# API .env (Prisma needs DATABASE_URL in the api package directory)
API_DIR="$ROOT_DIR/apps/api"
if [ -f "$API_DIR/.env" ]; then
  info "apps/api/.env already exists (skipping)"
else
  # Resolve DATABASE_URL from root .env or use default
  DB_URL=$(grep -E '^DATABASE_URL=' "$ROOT_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- || echo "")
  if [ -z "$DB_URL" ]; then
    DB_URL="postgresql://localhost:5432/manufacturehub"
  fi
  echo "DATABASE_URL=$DB_URL" > "$API_DIR/.env"
  info "apps/api/.env created (DATABASE_URL for Prisma)"
fi

# Web .env
WEB_DIR="$ROOT_DIR/apps/web"
if [ -f "$WEB_DIR/.env" ]; then
  info "apps/web/.env already exists (skipping)"
else
  echo "VITE_API_URL=http://localhost:3001" > "$WEB_DIR/.env"
  info "apps/web/.env created (pointing to local API)"
fi

echo ""

# ---------------------------------------------------------------------------
# 4. Install dependencies
# ---------------------------------------------------------------------------
info "Installing dependencies..."
pnpm install
info "Dependencies installed"

echo ""

# ---------------------------------------------------------------------------
# 5. Run Prisma migrations
# ---------------------------------------------------------------------------
info "Running Prisma generate..."
pnpm --filter @manufacturehub/api exec prisma generate

info "Running Prisma migrations..."
pnpm --filter @manufacturehub/api exec prisma migrate dev --name init 2>/dev/null \
  || pnpm --filter @manufacturehub/api exec prisma migrate dev
info "Migrations applied"

echo ""

# ---------------------------------------------------------------------------
# 6. Seed the database
# ---------------------------------------------------------------------------
info "Seeding database with sample data..."
pnpm --filter @manufacturehub/api exec prisma db seed
info "Database seeded"

echo ""

# ---------------------------------------------------------------------------
# Done!
# ---------------------------------------------------------------------------
echo "  ========================================="
echo -e "  ${GREEN}${BOLD}Setup complete!${NC}"
echo "  ========================================="
echo ""
echo "  To start the full stack in development mode:"
echo ""
echo -e "    ${BOLD}pnpm dev${NC}"
echo ""
echo "  This will start:"
echo "    - API server   at http://localhost:3001"
echo "    - Web frontend at http://localhost:5173"
echo ""
echo "  Dev user:  dev@manufacturehub.com"
echo "  User ID:   dev-user-1"
echo ""
