#!/usr/bin/env bash
set -euo pipefail

# ManufactureHub - Railway One-Click Deploy Script
# Run: ./scripts/setup-railway.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[+]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

# ---- 1. Check railway CLI ----
if ! command -v railway &>/dev/null; then
  error "Railway CLI not found. Install it first:
    brew install railway          # macOS
    npm i -g @railway/cli         # npm
    curl -fsSL https://railway.com/install.sh | sh  # Linux"
fi

info "Railway CLI found: $(railway --version)"

# ---- 2. Login ----
info "Logging in to Railway..."
railway login

# ---- 3. Create project ----
info "Initializing Railway project..."
railway init

# ---- 4. Provision PostgreSQL ----
info "Provisioning PostgreSQL database..."
railway add --plugin postgresql
warn "Waiting 10s for database to provision..."
sleep 10

# ---- 5. Set environment variables ----
info "Setting environment variables..."

# Generate JWT_SECRET or prompt
read -rp "Enter JWT_SECRET (leave blank to auto-generate): " JWT_INPUT
if [ -z "$JWT_INPUT" ]; then
  JWT_SECRET=$(openssl rand -base64 48)
  info "Generated JWT_SECRET"
else
  JWT_SECRET="$JWT_INPUT"
fi

railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set CORS_ORIGINS="*"

warn "CORS_ORIGINS is set to '*' for now. Update it to your frontend URL after deploy."

# ---- 6. Deploy ----
info "Deploying ManufactureHub..."
railway up --detach

info "Deployment started!"
echo ""
info "Next steps:"
echo "  1. Run 'railway open' to view your deployment dashboard"
echo "  2. Copy your backend URL from the Railway dashboard"
echo "  3. Update CORS_ORIGINS to your frontend URL:"
echo "     railway variables set CORS_ORIGINS=https://your-frontend.com"
echo "  4. Set VITE_API_URL in your frontend deploy to the backend URL"
echo ""
info "Done."
