---
description: Restarts the OpenClaw Gateway service and Telegram bot provider.
---

This workflow performs a deep restart of the OpenClaw Gateway service using macOS `launchctl`, resolved common port conflicts, and checks the logs to ensure the Telegram provider starts correctly.

### Steps

1. **Clean up conflicting services** — Prevent port 18789 collisions from ghost processes.
// turbo

```bash
launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist 2>/dev/null || true
pkill -f openclaw || true
pkill -f gateway || true
```

1. **Restart the primary Gateway service** — Uses the workspace-defined plist.
// turbo

```bash
launchctl unload ~/Library/LaunchAgents/com.openclaw.gateway.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.openclaw.gateway.plist
```

1. **Verify status** — Ensure the process is running and healthy.
// turbo

```bash
sleep 2
launchctl list | grep com.openclaw.gateway
```

1. **Tail logs** — Check specifically for the Telegram provider starting.
// turbo

```bash
tail -n 30 /tmp/openclaw-gateway.log
```

---
**Note:** If the log shows "pairing required", you will need to check Telegram for a pairing code and approve it using `openclaw pairing approve telegram <CODE>`.
