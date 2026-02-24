#!/bin/bash
# OpenClaw Workspace Start Script
# Managed via PM2 and launchd

set -euo pipefail

echo "==> [1/3] Ensuring OpenClaw Gateway is running (launchd)..."
# Check if loaded, if not load it
if ! launchctl list | grep -q ai.openclaw.gateway; then
    launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
fi
# Force restart to ensure fresh state
launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
echo "    Gateway restarted."

echo "==> [2/3] Starting background services via PM2..."
# Export PATH to ensure PM2 can find node/npm/npx/cloudflared
export PATH="/Users/forex/.nvm/versions/node/v24.12.0/bin:/opt/homebrew/bin:$PATH"

# Apply the ecosystem configuration
pm2 start ecosystem.config.js

echo "==> [3/3] Finalizing..."
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
