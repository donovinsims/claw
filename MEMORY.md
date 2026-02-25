# MEMORY.md - Agent Persistent Memory

_This is the primary cortical layer of the agent. If it's not here, it didn't happen._

## System Evolution & Milestones

### [2026-02-24] - Phase 5 Completion & Cleanup
- **Milestone**: Successfully completed Phase 5 Verification. End-to-end data flow confirmed from Lead Agent to Mission Control.
- **Milestone**: Uninstalled and removed Pencil MCP skills to streamline the agent's toolset.
- **Milestone**: Verified PM2-based service management is stable and self-healing via the watchdog.

### [2026-02-23] - The "New Guard" System Implementation
- **Milestone**: Unified the entire OpenClaw stack under a single PM2 ecosystem.
- **Milestone**: Implemented a "New Guard" watchdog (`scripts/watchdog.sh`) to prevent Telegram/Mission Control from disconnecting.
- **Milestone**: Created `./start.sh` and `./stop.sh` for simplified workspace management.
- **Technical Detail**: Integrated Cloudflare Quick Tunnels into PM2 as `mission-tunnel` and `gateway-tunnel`.
- **Technical Detail**: Added `convex-dev` to PM2 for real-time background data synchronization.
- **Next Step**: Wire CalendarView and GlobalSearch to live Convex data (currently mock).
- **Next Step**: Configure a persistent Cloudflare Tunnel with a custom domain.

### [2026-02-21] - Dashboard Initial Build
- **Milestone**: Deployed Mission Control dashboard (Next.js 15 + Convex).
- **Milestone**: Wired 4 specialized agents (Lead, Skill Extractor, Model Manager, Scrapling) to the dashboard Agent Panel.
- **Milestone**: Established the OpenClaw → Convex bridge for transcript ingestion.

## Core Preferences & Guidelines (User-Specific)
- **Identity**: Operating under the `OpenClaw` persona (see `SOUL.md`).
- **Tone**: Professional, direct, highly competent, no performative filler.
- **Persistence**: Strict adherence to the "Triple-Lock Persistence" strategy (`MEMORY.md`, `SOUL.md`, `CONTEXT_CHECKPOINT.md`).
- **Safety**: Always audit external skills before installation.

## Known Issues & Backlog
- [ ] Memory search embedding provider (OpenAI/Google) needs consistent auth in local config.
- [ ] CalendarView and GlobalSearch are currently using mock data; need wiring to Convex.
- [ ] Kimi K2.5 and Supermemory plugins are ready but not yet fully enabled for all agents.
- [ ] Need to establish a persistent backup routine for `~/.openclaw/backups/`.

---

_This file must be read at the start of every session and updated at the end of every significant task._
