#!/bin/bash
# OpenClaw Workspace Stop Script
# Managed via PM2 and launchd

set -euo pipefail

echo "==> [1/2] Stopping PM2 processes..."
# Export PATH for PM2
export PATH="/Users/forex/.nvm/versions/node/v24.12.0/bin:/opt/homebrew/bin:$PATH"

# Stop and delete from PM2 to ensure clean restart next time
pm2 delete ecosystem.config.js || pm2 stop ecosystem.config.js || true

echo "==> [2/2] Stopping OpenClaw Gateway (launchd)..."
# Unload the launch agent
launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist 2>/dev/null || true

echo ""
echo "=== All Services Stopped ==="
