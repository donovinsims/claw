#!/bin/bash
set -euo pipefail

echo "=== Cloudflare Tunnel Setup ==="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared.deb
        rm cloudflared.deb
    fi
fi

echo ""
echo "Steps to complete manually:"
echo "1. Run: cloudflared tunnel login"
echo "2. Run: cloudflared tunnel create openclaw-gateway"
echo "3. Update YOUR_TUNNEL_ID in cloudflared-config.yml"
echo "4. Run: cloudflared tunnel route dns openclaw-gateway openclaw.yourdomain.com"
echo "5. Run: cloudflared tunnel --config ~/openclaw-workspace/claw/infra/cloudflared-config.yml run"
echo ""
echo "For persistent service:"
echo "  sudo cloudflared service install"
