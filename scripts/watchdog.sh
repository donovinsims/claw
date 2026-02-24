#!/bin/bash

# OpenClaw Watchdog v1.1
# Logs to /Users/forex/.openclaw/logs/watchdog.log

LOG_FILE="/Users/forex/.openclaw/logs/watchdog.log"
GATEWAY_PORT=18789
PLIST_PATH="/Users/forex/Library/LaunchAgents/ai.openclaw.gateway.plist"
OPENCLAW_BIN="/Users/forex/.nvm/versions/node/v24.12.0/bin/openclaw"
PM2_BIN="/Users/forex/.nvm/versions/node/v24.12.0/bin/pm2"
JQ_BIN="/usr/bin/jq"
LSOF_BIN="/usr/sbin/lsof"
LAUNCHCTL_BIN="/bin/launchctl"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# 1. Check PM2 Processes (Gateway, Bridge, Dashboard, Convex, Tunnels)
# Export PATH to ensure PM2 can find node
export PATH="/Users/forex/.nvm/versions/node/v24.12.0/bin:/opt/homebrew/bin:$PATH"

for PROC in "openclaw-gateway" "claw-bridge" "claw-dashboard" "convex-dev" "mission-tunnel" "gateway-tunnel"; do
    STATUS=$("$PM2_BIN" jlist | "$JQ_BIN" -r ".[] | select(.name==\"$PROC\") | .pm2_env.status")
    if [ "$STATUS" != "online" ]; then
        log "CRITICAL: PM2 process $PROC is [$STATUS]. Restarting..."
        "$PM2_BIN" restart "$PROC"
    fi
done

log "Health check complete."
