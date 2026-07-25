#!/bin/bash
# =============================================================
# MedCampus — DuckDNS Auto-Update Script
# Usage: bash scripts/setup-duckdns.sh YOUR_TOKEN YOUR_SUBDOMAIN
# =============================================================

TOKEN=${1}
SUBDOMAIN=${2:-"medcampus"}

if [ -z "$TOKEN" ]; then
    echo "Usage: bash scripts/setup-duckdns.sh YOUR_DUCKDNS_TOKEN [subdomain]"
    echo "Token tersedia di: https://www.duckdns.org"
    exit 1
fi

# Create duckdns directory
mkdir -p ~/duckdns

# Create update script
cat > ~/duckdns/duck.sh << EOF
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${SUBDOMAIN}&token=${TOKEN}&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

chmod +x ~/duckdns/duck.sh

# Test it
bash ~/duckdns/duck.sh
echo ""
echo "DuckDNS response:"
cat ~/duckdns/duck.log
echo ""

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null | grep -v duck.sh; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -

echo ""
echo "[✓] DuckDNS auto-update configured for ${SUBDOMAIN}.duckdns.org"
echo "[✓] Updates every 5 minutes via cron"
echo ""
echo "Pastikan IP Oracle Cloud sudah diarahkan ke ${SUBDOMAIN}.duckdns.org"
echo "Cek di: https://www.duckdns.org"
