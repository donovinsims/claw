# CONTEXT_CHECKPOINT.md - The Recovery Guide

**What this is:** This is a high-level cheat sheet of our current context. If the session resets or we lose the thread, refer to this document to instantly re-orient yourself to the project state.

## Core Directives

1. **Always Read First:** Before initiating a new session or completing an complex task, read `MEMORY.md`, `SOUL.md`, and this `CONTEXT_CHECKPOINT.md`.
2. **Persistent State:** If you learn something new or reach a milestone, write it to `MEMORY.md`. If it's a core personality trait, update `SOUL.md`.
3. **Write-to-Know:** If it's not written down, it doesn't exist. You must log everything.

## Current Project State

- **Environment**: macOS
- **System**: OpenClaw Gateway + Mission Control Dashboard + Convex Backend.
- **Service Management**: Unified via PM2 (`ecosystem.config.js`) and `launchd`.
- **Availability**: "New Guard" watchdog script (`scripts/watchdog.sh`) ensures 24/7 uptime for Telegram and Dashboard services.
- **Key Capabilities**:
  - Scrapling MCP Server (advanced scraping).
  - High-availability Quick Tunnels (Dashboard & Gateway).
  - Triple-Lock Persistence Strategy active (`MEMORY.md`, `SOUL.md`, `CONTEXT_CHECKPOINT.md`).

## Active Goals

- **Stability**: Hardening the "New Guard" system and monitoring logs for any edge-case failures.
- **Integration**: Wiring mock dashboard components (Calendar/Search) to the live Convex backend.
- **Expansion**: Deploying and vetting new external skills via the Skill Extractor agent.

## What to do if you are asked to "Check the recovery guide"

Read this file, acknowledge your current state and capabilities, and ask the user what the next immediate objective is.
