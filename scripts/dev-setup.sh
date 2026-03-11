#!/usr/bin/env bash
set -euo pipefail

# Jace (ManufactureHub) - Local Development Setup
# Run: ./scripts/dev-setup.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[+]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "  Jace - Local Development Setup"
echo "  ───────────────────────────────"
echo ""

# ---- 1. Check prerequisites ----
info "Checking prerequisites..."

for cmd in node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    error "$cmd is not installed. Install Node.js 18+ first."
  fi
done

NODE_V=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_V" -lt 18 ]; then
  error "Node.js 18+ required (found v$(node -v))"
fi
info "Node $(node -v)"

# Check for pnpm (preferred) or npm
if command -v pnpm &>/dev/null; then
  PKG_MGR="pnpm"
elif command -v npm &>/dev/null; then
  PKG_MGR="npm"
fi
info "Package manager: $PKG_MGR"

# ---- 2. Install dependencies ----
info "Installing dependencies..."
$PKG_MGR install

# ---- 3. Setup API environment ----
API_DIR="$ROOT_DIR/apps/api"
if [ ! -f "$API_DIR/.env" ]; then
  info "Creating apps/api/.env..."
  cat > "$API_DIR/.env" <<'ENVEOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jace_dev
JWT_SECRET=dev-secret-change-in-production-min-32-chars!!
NODE_ENV=development
PORT=3001
CORS_ORIGINS=http://localhost:5173
ENVEOF
  info "Created apps/api/.env with local defaults"
else
  info "apps/api/.env already exists, skipping"
fi

# ---- 4. Setup web environment ----
WEB_DIR="$ROOT_DIR/apps/web"
if [ ! -f "$WEB_DIR/.env" ]; then
  info "Creating apps/web/.env..."
  cat > "$WEB_DIR/.env" <<'ENVEOF'
VITE_API_URL=http://localhost:3001
ENVEOF
  info "Created apps/web/.env pointing to local API"
else
  info "apps/web/.env already exists, skipping"
fi

# ---- 5. Database setup ----
info "Checking database..."
if command -v psql &>/dev/null; then
  if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw jace_dev; then
    info "Database 'jace_dev' exists"
  else
    warn "Creating database 'jace_dev'..."
    createdb jace_dev 2>/dev/null || warn "Could not create database. Create it manually or update DATABASE_URL in .env"
  fi
else
  warn "psql not found. Make sure PostgreSQL is running and DATABASE_URL is correct in apps/api/.env"
fi

# ---- 6. Prisma setup ----
info "Generating Prisma client..."
cd "$API_DIR"
npx prisma generate

info "Running database migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy 2>/dev/null || warn "Migrations failed. Check your DATABASE_URL."

# ---- 7. Seed database ----
read -rp "$(echo -e "${YELLOW}[?]${NC}") Seed database with sample data? [Y/n] " SEED_ANSWER
SEED_ANSWER=${SEED_ANSWER:-Y}
if [[ "$SEED_ANSWER" =~ ^[Yy] ]]; then
  info "Seeding database..."
  npx prisma db seed || warn "Seeding failed. You can run it later: cd apps/api && npx prisma db seed"
fi

cd "$ROOT_DIR"

# ---- Done ----
echo ""
echo "  ──────────────────────────────────────"
echo ""
info "Setup complete! Start development with:"
echo ""
echo "  $PKG_MGR run dev"
echo ""
echo "  API:  http://localhost:3001"
echo "  Web:  http://localhost:5173"
echo ""
