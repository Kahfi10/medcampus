#!/bin/bash
# =============================================================
# MedCampus — Deploy Script
# Jalankan setelah setup-server.sh dan clone repo
# Usage: bash scripts/deploy.sh
# =============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
step() { echo -e "\n${YELLOW}━━━ $1 ━━━${NC}"; }

APP_DIR="/var/www/medcampus"

cd $APP_DIR

# =============================================================
# STEP 1 — Setup .env files
# =============================================================
step "Step 1: Setup Environment Variables"

# Check if .env exists
if [ ! -f "apps/server/.env" ]; then
    echo ""
    echo "Setup .env untuk server..."
    read -p "DB Host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    read -p "DB User [medcampus_user]: " DB_USER
    DB_USER=${DB_USER:-medcampus_user}
    read -sp "DB Password: " DB_PASS
    echo ""
    read -p "DB Name [medcampus_db]: " DB_NAME
    DB_NAME=${DB_NAME:-medcampus_db}
    read -p "DuckDNS subdomain (contoh: medcampus): " DUCKDNS_SUB

    # Generate JWT secrets
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

    cat > apps/server/.env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:3306/${DB_NAME}"
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://${DUCKDNS_SUB}.duckdns.org
EOF

    cat > apps/client/.env.production << EOF
NEXT_PUBLIC_API_URL=https://${DUCKDNS_SUB}.duckdns.org
EOF

    log ".env files created"
else
    log ".env already exists, skipping"
fi

# =============================================================
# STEP 2 — Install dependencies
# =============================================================
step "Step 2: Install Dependencies"
npm install
log "Dependencies installed"

# =============================================================
# STEP 3 — Generate Prisma client
# =============================================================
step "Step 3: Generate Prisma Client"
cd apps/server
npx prisma generate
log "Prisma client generated"
cd $APP_DIR

# =============================================================
# STEP 4 — Run database migrations
# =============================================================
step "Step 4: Database Migration"
cd apps/server
npx prisma migrate deploy
log "Database migrated"
cd $APP_DIR

# =============================================================
# STEP 5 — Seed database
# =============================================================
step "Step 5: Seed Database"
cd apps/server
if npx tsx prisma/seed.ts; then
    log "Database seeded"
else
    echo "Seed mungkin sudah dijalankan sebelumnya, lanjutkan..."
fi
cd $APP_DIR

# =============================================================
# STEP 6 — Build applications
# =============================================================
step "Step 6: Build Applications"
npm run build --workspace=apps/server
log "Server built"

cd apps/client
npm run build
log "Client built"
cd $APP_DIR

# =============================================================
# STEP 7 — Start with PM2
# =============================================================
step "Step 7: Start with PM2"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
log "PM2 processes started"

# =============================================================
# STEP 8 — Setup PM2 startup
# =============================================================
step "Step 8: PM2 Startup on Boot"
pm2 startup | tail -1 | bash || warn "PM2 startup already configured"
pm2 save
log "PM2 startup configured"

echo ""
echo "============================================"
echo "  Deploy SELESAI!"
echo "============================================"
pm2 status
echo ""
echo "Langkah selanjutnya:"
echo "  1. Setup Nginx: bash scripts/setup-nginx.sh"
echo "  2. Setup SSL:   sudo certbot --nginx -d YOUR_SUBDOMAIN.duckdns.org"
