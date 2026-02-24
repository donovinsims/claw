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

# 1. Check Gateway Port
if ! "$LSOF_BIN" -i :$GATEWAY_PORT > /dev/null; then
    log "CRITICAL: Gateway port $GATEWAY_PORT is not listening. Healing..."
    "$LAUNCHCTL_BIN" unload "$PLIST_PATH" 2>/dev/null
    sleep 2
    GHOST_PID=$("$LSOF_BIN" -t -i :$GATEWAY_PORT)
    if [ -n "$GHOST_PID" ]; then
        log "Killing ghost process $GHOST_PID on port $GATEWAY_PORT"
        kill -9 "$GHOST_PID"
    fi
    "$LAUNCHCTL_BIN" load "$PLIST_PATH"
    log "Gateway service reloaded."
fi

# 2. Check Telegram Status
# Only run doctor if port is listening
if "$LSOF_BIN" -i :$GATEWAY_PORT > /dev/null; then
    if ! "$OPENCLAW_BIN" doctor | grep -q "Telegram: ok"; then
        log "WARN: Telegram status is NOT OK. Restarting Gateway..."
        "$LAUNCHCTL_BIN" unload "$PLIST_PATH"
        sleep 5
        "$LAUNCHCTL_BIN" load "$PLIST_PATH"
        log "Gateway service reloaded due to Telegram failure."
    fi
fi

# 3. Check PM2 Processes (Bridge, Dashboard, Convex, Tunnels)
# Export PATH to ensure PM2 can find node
export PATH="/Users/forex/.nvm/versions/node/v24.12.0/bin:/opt/homebrew/bin:$PATH"

for PROC in "claw-bridge" "claw-dashboard" "convex-dev" "mission-tunnel" "gateway-tunnel"; do
    STATUS=$("$PM2_BIN" jlist | "$JQ_BIN" -r ".[] | select(.name==\"$PROC\") | .pm2_env.status")
    if [ "$STATUS" != "online" ]; then
        log "CRITICAL: PM2 process $PROC is [$STATUS]. Restarting..."
        "$PM2_BIN" restart "$PROC"
    fi
done

log "Health check complete."
