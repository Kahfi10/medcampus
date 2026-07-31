#!/bin/bash
# =============================================================
# MedCampus — Nginx Setup Script (Stage 1 Hardened)
# Usage: sudo bash scripts/setup-nginx.sh medcampus.duckdns.org
# =============================================================

DOMAIN=${1:-"medcampus.duckdns.org"}

echo "Setting up Nginx for domain: $DOMAIN"

sudo rm -f /etc/nginx/sites-enabled/default

sudo tee /etc/nginx/sites-available/medcampus > /dev/null << EOF
# Stage 1: HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

# Stage 1: HTTPS main server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL — filled by Certbot
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # Stage 1 Fix: explicit TLS protocols & strong cipher suite
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Stage 1 Fix: Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Stage 1 Fix: HSTS dengan preload
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Stage 5: Permissions-Policy — matikan fitur browser yang tidak dibutuhkan
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" always;

    # Stage 1 Fix: sembunyikan server info
    proxy_hide_header X-Powered-By;
    server_tokens off;

    # Stage 1 Fix: batasi ukuran request body di Nginx
    client_max_body_size 10k;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain application/json application/javascript text/css application/xml;

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
        proxy_hide_header  X-Powered-By;
    }

    # Next.js Client
    location / {
        proxy_pass         http://127.0.0.1:4000;
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

sudo ln -sf /etc/nginx/sites-available/medcampus /etc/nginx/sites-enabled/medcampus
sudo nginx -t && sudo systemctl reload nginx

echo "[OK] Nginx configured with Stage 1 security hardening for $DOMAIN"
echo "Next: sudo certbot --nginx -d ${DOMAIN}"
