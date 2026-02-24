#!/bin/bash
# OpenClaw Workspace Start Script
# Managed via PM2 and launchd

set -euo pipefail

echo "==> [1/2] Starting all background services via PM2..."
# Export PATH to ensure PM2 can find node/npm/npx/cloudflared/openclaw
export PATH="/Users/forex/.nvm/versions/node/v24.12.0/bin:/opt/homebrew/bin:$PATH"

# Apply the ecosystem configuration (includes Gateway, Bridge, Dashboard, Convex, Tunnels)
pm2 start ecosystem.config.js

echo "==> [2/2] Finalizing..."
sleep 2
pm2 list

echo ""
echo "=== All Services Initiated ==="
echo "Dashboard: http://localhost:3000"
echo "Gateway:   ws://localhost:18789"
echo ""
echo "Quick Tunnel URLs can be found in:"
echo "  Mission Control: grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/mission-tunnel.*"
echo "  Gateway:         grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/gateway-tunnel.*"
echo ""
echo "Logs available at /tmp/claw-*.log and /tmp/convex-dev.log"
