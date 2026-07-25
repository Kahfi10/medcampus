#!/bin/bash
# =============================================================
# MedCampus — Server Setup Script
# Jalankan di Oracle Cloud Ubuntu 22.04 ARM (A1 Flex)
# Usage: bash setup-server.sh
# =============================================================

set -e  # Stop on any error

echo "============================================"
echo "  MedCampus Server Setup"
echo "  Ubuntu 22.04 ARM — Oracle Cloud"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
step() { echo -e "\n${YELLOW}━━━ $1 ━━━${NC}"; }

# =============================================================
# STEP 1 — Update system
# =============================================================
step "Step 1: Update System"
sudo apt-get update -y && sudo apt-get upgrade -y
log "System updated"

# =============================================================
# STEP 2 — Install Node.js 20.x LTS
# =============================================================
step "Step 2: Install Node.js 20.x"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
log "Node.js $(node --version) installed"
log "npm $(npm --version) installed"

# =============================================================
# STEP 3 — Install PM2
# =============================================================
step "Step 3: Install PM2"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
log "PM2 $(pm2 --version) installed"

# =============================================================
# STEP 4 — Install MariaDB
# =============================================================
step "Step 4: Install MariaDB"
if ! command -v mysql &> /dev/null; then
    sudo apt-get install -y mariadb-server mariadb-client
    sudo systemctl enable mariadb
    sudo systemctl start mariadb
fi
log "MariaDB installed and running"

# =============================================================
# STEP 5 — Setup Database
# =============================================================
step "Step 5: Setup Database"
read -sp "Enter password for medcampus_user: " DB_PASS
echo ""

sudo mysql -e "
CREATE DATABASE IF NOT EXISTS medcampus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'medcampus_user'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON medcampus_db.* TO 'medcampus_user'@'localhost';
FLUSH PRIVILEGES;
"
log "Database medcampus_db and user created"

# Save DB password to temp file for .env setup later
echo "DB_PASS=$DB_PASS" > /tmp/medcampus_db_pass.txt

# =============================================================
# STEP 6 — Install Nginx
# =============================================================
step "Step 6: Install Nginx"
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi
log "Nginx installed and running"

# =============================================================
# STEP 7 — Install Certbot
# =============================================================
step "Step 7: Install Certbot"
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
fi
log "Certbot installed"

# =============================================================
# STEP 8 — Configure UFW Firewall
# =============================================================
step "Step 8: Configure Firewall (UFW)"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable
log "UFW configured: SSH + Nginx allowed"

# =============================================================
# STEP 9 — Create app directory
# =============================================================
step "Step 9: Create App Directory"
sudo mkdir -p /var/www/medcampus
sudo chown $USER:$USER /var/www/medcampus
log "Directory /var/www/medcampus created"

echo ""
echo "============================================"
echo "  Server setup SELESAI!"
echo "============================================"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Clone repo: git clone https://github.com/Kahfi10/medcampus.git /var/www/medcampus"
echo "  2. Jalankan: bash /var/www/medcampus/scripts/deploy.sh"
echo ""
echo "DB Password tersimpan di: /tmp/medcampus_db_pass.txt"
echo "Pastikan untuk menghapus file tersebut setelah setup selesai!"
