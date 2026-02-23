#!/bin/zsh

echo "==> Restarting OpenClaw Gateway via launchd..."
launchctl unload ~/Library/LaunchAgents/com.openclaw.gateway.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.openclaw.gateway.plist

echo "==> Gateway restarted. Checking launchctl status..."
sleep 1
launchctl list | grep com.openclaw.gateway

echo "==> Tailing last 25 lines of the gateway log..."
echo "------------------------------------------------"
tail -n 25 /tmp/openclaw-gateway.log
echo "------------------------------------------------"
echo "Diagnostic: If you see '[telegram] [default] starting provider' and the PID has a 0 status above, the bot is running."
echo "If Telegram still ignores you, send '/ping' in Telegram and watch this log for incoming messages."
