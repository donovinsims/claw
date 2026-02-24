#!/bin/bash
# OpenClaw Workspace Stop Script
# Managed via PM2 and launchd

set -euo pipefail

echo "==> [1/1] Stopping all background services via PM2..."
# Export PATH for PM2
export PATH="/Users/forex/.nvm/versions/node/v24.12.0/bin:/opt/homebrew/bin:$PATH"

# Stop all processes defined in the ecosystem config
pm2 stop ecosystem.config.js || pm2 stop all || true

echo ""
echo "=== All Services Stopped ==="
