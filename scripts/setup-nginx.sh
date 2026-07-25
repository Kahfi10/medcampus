#!/bin/bash
# =============================================================
# MedCampus — Nginx Setup Script
# Usage: bash scripts/setup-nginx.sh YOUR_SUBDOMAIN.duckdns.org
# =============================================================

DOMAIN=${1:-"medcampus.duckdns.org"}

echo "Setting up Nginx for domain: $DOMAIN"

# Remove default config
sudo rm -f /etc/nginx/sites-enabled/default

# Create MedCampus config
sudo tee /etc/nginx/sites-available/medcampus > /dev/null << EOF
# HTTP → redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL — will be filled by Certbot
    # ssl_certificate ...
    # ssl_certificate_key ...

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain application/json application/javascript text/css;

    # API Server (Express) — /api/*, /health, /api-docs
    location ~ ^/(api|health|api-docs) {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    # Next.js Client — semua path lainnya
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/medcampus /etc/nginx/sites-enabled/medcampus

# Test config
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "[✓] Nginx configured for $DOMAIN"
echo ""
echo "Langkah selanjutnya — Issue SSL certificate:"
echo "  sudo certbot --nginx -d ${DOMAIN}"
