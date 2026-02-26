#!/bin/bash

echo "Running Healthcheck for Telegram Bot & Gateway..."

# 1. Check if PM2 process is running
PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"openclaw-gateway","pm2_env":{"status":"online"' | wc -l)

if [ "$PM2_STATUS" -eq "0" ]; then
  echo "❌ FAILED: openclaw-gateway is not running in PM2 or is offline."
  exit 1
fi

echo "✅ PASSED: openclaw-gateway is online in PM2."

# 2. Check if the gateway HTTP server is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:18789/)

if [ "$HTTP_CODE" -ne "200" ]; then
  echo "❌ FAILED: Gateway HTTP server on port 18789 returned status $HTTP_CODE."
  exit 1
fi

echo "✅ PASSED: Gateway HTTP server is responding."
echo "All healthchecks passed!"
exit 0
