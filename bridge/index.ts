import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

// Configuration
const OPENCLAW_AGENTS_DIR = join(homedir(), ".openclaw", "agents");
// IMPORTANT: Convex HTTP actions are served at your deployment's .convex.site URL,
// NOT localhost. Find this in your Convex dashboard under Settings > URL & Deploy Key.
// It looks like: https://happy-animal-123.convex.site
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL;
if (!CONVEX_SITE_URL) {
  console.error("[bridge] FATAL: CONVEX_SITE_URL env var is required.");
  console.error("[bridge] Set it to your deployment URL, e.g. https://your-app-123.convex.site");
  process.exit(1);
}
const POLL_INTERVAL_MS = 2000;

// Track file positions so we only read new lines
const filePositions = new Map<string, number>();

async function pushToConvex(event: string, agentId: string, data: Record<string, unknown>) {
  try {
    const res = await fetch(`${CONVEX_SITE_URL}/api/openclaw-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, agentId, data }),
    });

    if (!res.ok) {
      console.error(`[bridge] Convex push failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[bridge] Convex push error:`, err);
  }
}

function parseTranscriptLine(line: string): { role: string; content: string; tool?: string } | null {
  try {
    const parsed = JSON.parse(line);
    return {
      role: parsed.role ?? "unknown",
      content: typeof parsed.content === "string"
        ? parsed.content
        : JSON.stringify(parsed.content),
      tool: parsed.tool_name ?? parsed.name,
    };
  } catch {
    return null;
  }
}

async function processNewLines(filePath: string, agentId: string) {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const lastPos = filePositions.get(filePath) ?? 0;

    if (lines.length <= lastPos) return;

    const newLines = lines.slice(lastPos);
    filePositions.set(filePath, lines.length);

    for (const line of newLines) {
      const parsed = parseTranscriptLine(line);
      if (!parsed) continue;

      // Map transcript events to Convex activity events
      if (parsed.role === "assistant") {
        await pushToConvex("activity", agentId, {
          type: "comment",
          message: parsed.content.slice(0, 200),
        });

        // Detect status changes in assistant messages
        if (parsed.content.toLowerCase().includes("completed") ||
            parsed.content.toLowerCase().includes("done")) {
          await pushToConvex("agent.status_changed", agentId, {
            status: "idle",
          });
        }
      }

      if (parsed.tool === "bash" || parsed.tool === "exec") {
        await pushToConvex("activity", agentId, {
          type: "status_change",
          message: `Executed tool: ${parsed.tool}`,
        });
        await pushToConvex("agent.status_changed", agentId, {
          status: "working",
        });
      }
    }
  } catch {
    // File might be mid-write, skip
  }
}

async function scanAgents() {
  try {
    const agentDirs = await readdir(OPENCLAW_AGENTS_DIR, { withFileTypes: true });

    for (const dir of agentDirs) {
      if (!dir.isDirectory()) continue;

      const agentId = dir.name;
      const sessionsDir = join(OPENCLAW_AGENTS_DIR, agentId, "sessions");

      try {
        const sessionFiles = await readdir(sessionsDir);
        const jsonlFiles = sessionFiles.filter((f) => f.endsWith(".jsonl"));

        for (const file of jsonlFiles) {
          await processNewLines(join(sessionsDir, file), agentId);
        }
      } catch {
        // No sessions dir yet, skip
      }
    }
  } catch (err) {
    console.error(`[bridge] Agent scan error:`, err);
  }
}

// Main loop
console.log(`[bridge] Starting OpenClaw → Convex bridge`);
console.log(`[bridge] Watching: ${OPENCLAW_AGENTS_DIR}`);
console.log(`[bridge] Pushing to: ${CONVEX_SITE_URL}`);

setInterval(scanAgents, POLL_INTERVAL_MS);
scanAgents(); // Initial scan
