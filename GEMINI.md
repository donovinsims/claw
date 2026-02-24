# OpenClaw Workspace Context

You are operating within the `openclaw-workspace`. This is a monorepo-style environment for the OpenClaw ecosystem, which includes a local agent framework, a Next.js/Convex dashboard (Mission Control), and various automation scripts.

## Directory Structure

- `/Users/forex/.openclaw/` - The core OpenClaw runtime directory. Contains agent workspaces (`agents/`), skills, device auth, backups, and the main `openclaw.json` config.
- `/Users/forex/openclaw-workspace/claw/` - The Mission Control dashboard source code (Next.js 15 + Convex backend + Bridge process).
- `/Users/forex/openclaw-workspace/openclaw-antigravity1/` - Additional OpenClaw components/source code.
- `/Users/forex/openclaw-workspace/.gemini/` - Gemini CLI settings.

## Model Environment

The environment has access to multiple models through different providers.
Gemini CLI natively uses Google models via the `BRAVE_API_KEY` (which acts as a Gemini API key in this setup).

To access other models (like Ollama or Moonshot), you must route your commands through the OpenClaw Telegram bot or use the `ollama` CLI directly.

Available Models in OpenClaw (`~/.openclaw/openclaw.json`):

1. `google-antigravity/gemini-3-flash` (Primary)
2. `moonshot/kimi-k2.5`
3. `ollama/llama3.2` (Local)
4. `ollama/llama3` (Local)
5. `ollama/donovin/vibes` (Local)

## Active Agents

OpenClaw coordinates several specialized agents:

- **Lead Agent** (`lead`): Main orchestrator, connected to the Telegram channel.
- **Skill Extractor** (`skill-extractor`)
- **Model Manager** (`model-manager`)
- **Scrapling Agent** (`scrapling-agent`): Connects to the scrapling MCP server.
- **File Organizer** (`file-organizer`)

## Key Workflows

The workspace has automated workflows defined in `.agents/workflows/` (or similar `*agents/workflows/` dirs):

- `/restart-openclaw`: Restarts the OpenClaw Gateway service and Telegram bot provider.
- `/scrape-notion`: Scrapes Notion pages.
- `/update_clawdbot`: Updates Clawdbot from upstream.

## General Guidelines

- **Persistence**: OpenClaw uses a strict "Triple-Lock Persistence" model (`MEMORY.md`, `CONTEXT_CHECKPOINT.md`). If you are asked to help manage memory, refer to these files.
- **Tone**: The system persona ("SOUL.md") emphasizes being genuinely helpful, having opinions, earning trust through competence, and avoiding performative filler ("Great question!"). Adopt this direct, highly competent tone in your responses.
- **Infrastructure**: The dashboard uses a `bridge` process to ingest `JSONL` activity logs from local agents into a Convex backend, which the Next.js frontend then displays.
