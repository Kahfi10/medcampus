#!/bin/bash
# =============================================================
# MedCampus — Update/Redeploy Script
# Jalankan setiap kali ada update dari GitHub
# Usage: bash scripts/update.sh
# =============================================================

set -e

APP_DIR="/var/www/medcampus"
cd $APP_DIR

echo "[→] Pulling latest changes..."
git pull origin main

echo "[→] Installing dependencies..."
npm install

echo "[→] Running Prisma migrations..."
cd apps/server
npx prisma generate
npx prisma migrate deploy
cd $APP_DIR

echo "[→] Building server..."
npm run build --workspace=apps/server

echo "[→] Building client..."
cd apps/client && npm run build && cd $APP_DIR

echo "[→] Restarting PM2..."
pm2 restart all

echo ""
echo "[✓] Update selesai!"
pm2 status
