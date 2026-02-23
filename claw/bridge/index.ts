import {
  appendFile,
  mkdir,
  open,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { createHash, createHmac } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

// Configuration
const OPENCLAW_AGENTS_DIR = join(homedir(), ".openclaw", "agents");
const BRIDGE_STATE_PATH = process.env.BRIDGE_STATE_PATH ??
  join(homedir(), ".openclaw", "mission-control", "bridge-cursors.json");
const BRIDGE_DEAD_LETTER_PATH = process.env.BRIDGE_DEAD_LETTER_PATH ??
  join(homedir(), ".openclaw", "mission-control", "dead-letter.jsonl");
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL;
const OPENCLAW_HOOK_SECRET = process.env.OPENCLAW_HOOK_SECRET;
const NODE_ENV = process.env.NODE_ENV ?? "development";
const POLL_INTERVAL_MS = Number(process.env.BRIDGE_POLL_INTERVAL_MS ?? 2000);
const HEARTBEAT_INTERVAL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 200;
const JITTER_MS = 150;

if (!CONVEX_SITE_URL) {
  console.error("[bridge] FATAL: CONVEX_SITE_URL env var is required.");
  console.error("[bridge] Set it to your deployment URL, e.g. https://your-app-123.convex.site");
  process.exit(1);
}
if (NODE_ENV !== "development" && !OPENCLAW_HOOK_SECRET) {
  console.error("[bridge] FATAL: OPENCLAW_HOOK_SECRET is required outside development.");
  process.exit(1);
}

if (!OPENCLAW_HOOK_SECRET) {
  console.warn("[bridge] WARNING: OPENCLAW_HOOK_SECRET not set; bridge will send unsigned requests.");
}

type JsonObject = Record<string, unknown>;

interface TranscriptMessage {
  role?: string;
  content?: unknown;
  toolName?: string;
  toolCallId?: string;
  [key: string]: unknown;
}

interface TranscriptEnvelope {
  type?: string;
  message?: TranscriptMessage;
  [key: string]: unknown;
}

interface BridgeEvent {
  eventId: string;
  event: string;
  agentId: string;
  sourceSessionId: string;
  sourceOffset: number;
  data: Record<string, unknown>;
}

interface CursorEntry {
  offset: number;
  inode: number;
  mtimeMs: number;
  key: string;
  updatedAt: number;
}

interface CursorStateFile {
  version: number;
  updatedAt: number;
  cursors: Record<string, CursorEntry>;
}

interface DeliveryMetrics {
  scans: number;
  scannedFiles: number;
  pendingQueue: number;
  delivered: number;
  failed: number;
  retries: number;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
}

const NON_MESSAGE_TYPES = new Set(["session", "custom", "thinking_level_change"]);
const seenUnknownFingerprints = new Set<string>();
const cursorState = new Map<string, CursorEntry>();
const metrics: DeliveryMetrics = {
  scans: 0,
  scannedFiles: 0,
  pendingQueue: 0,
  delivered: 0,
  failed: 0,
  retries: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
};
let scanInFlight = false;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replaceLoneSurrogates(text: string): string {
  if (text.length === 0) return text;

  let out = "";
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += text[index] + text[index + 1];
        index += 1;
      } else {
        out += "\uFFFD";
      }
      continue;
    }

    if (code >= 0xdc00 && code <= 0xdfff) {
      out += "\uFFFD";
      continue;
    }

    out += text[index];
  }

  return out;
}

function normalizeWhitespace(text: string): string {
  return replaceLoneSurrogates(text).replace(/\s+/g, " ").trim();
}

const COMPLETION_SIGNAL_PATTERN = /\b(done|completed|complete|finished)\b/i;
const TELEGRAM_ENVELOPE_PATTERN = /^\[\s*telegram\b/i;

function truncate(text: string, maxLength = 240): string {
  const sanitized = replaceLoneSurrogates(text);
  if (sanitized.length <= maxLength) return sanitized;

  const targetLength = Math.max(0, maxLength - 1);
  let prefix = sanitized.slice(0, targetLength);
  if (prefix.length > 0) {
    const lastCode = prefix.charCodeAt(prefix.length - 1);
    if (lastCode >= 0xd800 && lastCode <= 0xdbff) {
      prefix = prefix.slice(0, -1);
    }
  }

  return `${prefix}…`;
}

function sanitizeJsonValue(value: unknown): unknown {
  if (typeof value === "string") return replaceLoneSurrogates(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeJsonValue(item));
  if (isObject(value)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, innerValue] of Object.entries(value)) {
      sanitized[key] = sanitizeJsonValue(innerValue);
    }
    return sanitized;
  }
  return value;
}

function hashHex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function serializeForFingerprint(value: unknown): string {
  if (isObject(value)) {
    const type = typeof value.type === "string" ? value.type : "unknown";
    const keys = Object.keys(value).sort().slice(0, 12).join(",");
    return `object:${type}:${keys}`;
  }
  return `${typeof value}:${String(value).slice(0, 80)}`;
}

function logUnknownShapeOnce(
  reason: string,
  source: unknown,
  sourceSessionId: string,
  sourceOffset: number,
) {
  const fingerprint = createHash("sha1")
    .update(`${reason}|${serializeForFingerprint(source)}`)
    .digest("hex")
    .slice(0, 12);

  if (seenUnknownFingerprints.has(fingerprint)) return;
  seenUnknownFingerprints.add(fingerprint);

  console.warn(
    `[bridge] unknown-shape ${JSON.stringify({
      reason,
      fingerprint,
      sourceSessionId,
      sourceOffset,
      sample: serializeForFingerprint(source),
    })}`,
  );
}

function buildCursorKey(filePath: string, inode: number, mtimeMs: number): string {
  return `${filePath}|${inode}|${mtimeMs}`;
}

async function loadCursorState() {
  try {
    const raw = await readFile(BRIDGE_STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as CursorStateFile;
    if (!isObject(parsed) || !isObject(parsed.cursors)) return;

    for (const [filePath, entry] of Object.entries(parsed.cursors)) {
      if (!isObject(entry)) continue;
      if (
        typeof entry.offset !== "number" ||
        typeof entry.inode !== "number" ||
        typeof entry.mtimeMs !== "number" ||
        typeof entry.key !== "string" ||
        typeof entry.updatedAt !== "number"
      ) {
        continue;
      }
      cursorState.set(filePath, {
        offset: entry.offset,
        inode: entry.inode,
        mtimeMs: entry.mtimeMs,
        key: entry.key,
        updatedAt: entry.updatedAt,
      });
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error("[bridge] Failed to load cursor state:", error);
    }
  }
}

async function persistCursorState() {
  try {
    const payload: CursorStateFile = {
      version: 1,
      updatedAt: Date.now(),
      cursors: Object.fromEntries(cursorState.entries()),
    };
    await mkdir(dirname(BRIDGE_STATE_PATH), { recursive: true });
    await writeFile(BRIDGE_STATE_PATH, JSON.stringify(payload, null, 2), "utf-8");
  } catch (error) {
    console.error("[bridge] Failed to persist cursor state:", error);
  }
}

function signPayload(payload: string): string | undefined {
  if (!OPENCLAW_HOOK_SECRET) return undefined;
  const digest = createHmac("sha256", OPENCLAW_HOOK_SECRET).update(payload).digest("hex");
  return `sha256=${digest}`;
}

function shouldRetryHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function backoffDelay(attempt: number): number {
  const exponential = BASE_BACKOFF_MS * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * JITTER_MS);
  return exponential + jitter;
}

function createEventId(
  sessionPath: string,
  sourceOffset: number,
  normalizedRole: string,
  normalizedContent: string,
): string {
  const normalizedContentHash = hashHex(normalizedContent);
  return hashHex(`${sessionPath}|${sourceOffset}|${normalizedRole}|${normalizedContentHash}`);
}

function extractTextBlocks(content: unknown): {
  text: string;
  toolCalls: string[];
  unknownBlockTypes: string[];
} {
  const textParts: string[] = [];
  const toolCalls: string[] = [];
  const unknownBlockTypes: string[] = [];

  const appendToolCall = (name: unknown) => {
    if (typeof name === "string" && name.length > 0) {
      toolCalls.push(name);
    }
  };

  if (typeof content === "string") {
    return { text: normalizeWhitespace(content), toolCalls, unknownBlockTypes };
  }

  const blocks = Array.isArray(content) ? content : [content];
  for (const block of blocks) {
    if (!isObject(block)) {
      unknownBlockTypes.push(typeof block);
      continue;
    }

    const blockType = typeof block.type === "string" ? block.type : "unknown";
    switch (blockType) {
      case "text":
        if (typeof block.text === "string" && block.text.trim().length > 0) {
          textParts.push(block.text);
        }
        break;
      case "toolCall":
        appendToolCall(block.name);
        break;
      case "toolResult":
        appendToolCall(block.toolName);
        if (typeof block.text === "string" && block.text.trim().length > 0) {
          textParts.push(block.text);
        }
        break;
      case "thinking":
        // Intentionally ignored for activity text.
        break;
      default:
        unknownBlockTypes.push(blockType);
        if (typeof block.text === "string" && block.text.trim().length > 0) {
          textParts.push(block.text);
        }
    }
  }

  return {
    text: normalizeWhitespace(textParts.join(" ")),
    toolCalls,
    unknownBlockTypes,
  };
}

function summarizeMessage(role: string, text: string, toolCalls: string[], toolName?: string): string {
  if (text.length > 0) {
    return truncate(text);
  }
  if (toolCalls.length > 0) {
    return `Invoked tool ${toolCalls.join(", ")}`;
  }
  if (toolName) {
    return `Tool result from ${toolName}`;
  }
  return role === "assistant" ? "Assistant update" : "Message";
}

function extractEnvelopeMeta(text: string): {
  body: string;
  channel: string | null;
} {
  const match = text.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!match) {
    return {
      body: text,
      channel: null,
    };
  }

  const header = normalizeWhitespace(match[1] ?? "");
  const body = normalizeWhitespace(match[2] ?? "");
  const channelToken = header.split(/\s+/)[0] ?? "";

  return {
    body,
    channel: channelToken.length > 0 ? channelToken.toLowerCase() : null,
  };
}

function createBridgeEvent(
  sessionPath: string,
  sourceOffset: number,
  sourceSessionId: string,
  agentId: string,
  normalizedRole: string,
  event: string,
  data: Record<string, unknown>,
): BridgeEvent {
  const sanitizedData = sanitizeJsonValue(data) as Record<string, unknown>;
  const normalizedContent = JSON.stringify({ event, data: sanitizedData });
  return {
    eventId: createEventId(sessionPath, sourceOffset, normalizedRole, normalizedContent),
    event,
    agentId,
    sourceSessionId,
    sourceOffset,
    data: sanitizedData,
  };
}

function mapEnvelopeToEvents(
  sessionPath: string,
  agentId: string,
  sourceSessionId: string,
  sourceOffset: number,
  envelope: TranscriptEnvelope,
): BridgeEvent[] {
  if (envelope.type !== "message") {
    if (typeof envelope.type !== "string" || !NON_MESSAGE_TYPES.has(envelope.type)) {
      logUnknownShapeOnce("unsupported_envelope_type", envelope, sourceSessionId, sourceOffset);
    }
    return [];
  }

  if (!isObject(envelope.message)) {
    logUnknownShapeOnce("missing_message_payload", envelope, sourceSessionId, sourceOffset);
    return [];
  }

  const message = envelope.message as TranscriptMessage;
  const role = typeof message.role === "string" ? message.role : "unknown";
  const normalizedRole = role.toLowerCase();
  const toolName = typeof message.toolName === "string" ? message.toolName : undefined;
  const { text, toolCalls, unknownBlockTypes } = extractTextBlocks(message.content);

  for (const blockType of unknownBlockTypes) {
    logUnknownShapeOnce(
      `unknown_message_block:${blockType}`,
      message.content,
      sourceSessionId,
      sourceOffset,
    );
  }

  const summary = summarizeMessage(role, text, toolCalls, toolName);
  const feedType = role === "toolResult" || toolCalls.length > 0 ? "status_change" : "comment";
  const roleLabel = role === "toolResult" ? "Tool" : role.charAt(0).toUpperCase() + role.slice(1);
  const envelopeMeta = extractEnvelopeMeta(text);
  const isTelegramInstruction = normalizedRole === "user" &&
    (envelopeMeta.channel === "telegram" || TELEGRAM_ENVELOPE_PATTERN.test(text));
  const instructionText = isTelegramInstruction ? (envelopeMeta.body || text) : "";
  const hasCompletionSignal = normalizedRole === "assistant" &&
    COMPLETION_SIGNAL_PATTERN.test(text.length > 0 ? text : summary);

  const events: BridgeEvent[] = [
    createBridgeEvent(
      sessionPath,
      sourceOffset,
      sourceSessionId,
      agentId,
      normalizedRole,
      "activity",
      {
        type: feedType,
        message: `${roleLabel}: ${summary}`,
        metadata: {
          role,
          toolName: toolName ?? null,
          toolCalls,
          roleLabel,
          summary,
          rawText: truncate(text, 2000),
          sourceSessionId,
          sourceOffset,
          channel: envelopeMeta.channel,
          isTelegramInstruction,
          instructionText: instructionText.length > 0 ? instructionText : null,
          hasCompletionSignal,
        },
      },
    ),
  ];

  if (toolCalls.length > 0) {
    events.push(
      createBridgeEvent(
        sessionPath,
        sourceOffset,
        sourceSessionId,
        agentId,
        normalizedRole,
        "agent.status_changed",
        {
          status: "working",
          currentTask: `Running ${toolCalls.join(", ")}`,
        },
      ),
    );
  }

  if (hasCompletionSignal) {
    events.push(
      createBridgeEvent(
        sessionPath,
        sourceOffset,
        sourceSessionId,
        agentId,
        normalizedRole,
        "agent.status_changed",
        {
          status: "idle",
        },
      ),
    );
  }

  return events;
}

async function writeDeadLetter(record: Record<string, unknown>) {
  try {
    await mkdir(dirname(BRIDGE_DEAD_LETTER_PATH), { recursive: true });
    await appendFile(BRIDGE_DEAD_LETTER_PATH, `${JSON.stringify(record)}\n`, "utf-8");
  } catch (error) {
    console.error("[bridge] Failed to write dead-letter entry:", error);
  }
}

async function deliverEvent(event: BridgeEvent): Promise<boolean> {
  metrics.pendingQueue += 1;
  const payload = JSON.stringify(event);
  const signature = signPayload(payload);
  let lastErrorCode: string | null = null;
  let lastStatus: number | null = null;
  let lastResponseBody = "";

  try {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      const startedAt = Date.now();
      try {
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
        const res = await fetch(`${CONVEX_SITE_URL}/api/openclaw-hook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(signature ? { "x-openclaw-signature": signature } : {}),
          },
          body: payload,
          signal: abortController.signal,
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - startedAt;
        if (res.ok) {
          metrics.delivered += 1;
          metrics.lastSuccessAt = Date.now();
          console.log(
            `[bridge] delivery ${JSON.stringify({
              sessionId: event.sourceSessionId,
              eventId: event.eventId,
              offset: event.sourceOffset,
              attempt,
              status: "success",
              latencyMs,
            })}`,
          );
          return true;
        }

        lastStatus = res.status;
        lastErrorCode = `http_${res.status}`;
        lastResponseBody = truncate(await res.text(), 500);
        const retryable = shouldRetryHttpStatus(res.status);

        console.error(
          `[bridge] delivery ${JSON.stringify({
            sessionId: event.sourceSessionId,
            eventId: event.eventId,
            offset: event.sourceOffset,
            attempt,
            status: retryable && attempt < MAX_RETRIES ? "retrying" : "failed",
            latencyMs,
            errorCode: lastErrorCode,
          })}`,
        );

        if (!retryable || attempt >= MAX_RETRIES) {
          break;
        }

        metrics.retries += 1;
      } catch (error) {
        const latencyMs = Date.now() - startedAt;
        const message = error instanceof Error ? error.message : String(error);
        lastErrorCode = error instanceof DOMException && error.name === "AbortError"
          ? "timeout"
          : "network_error";

        console.error(
          `[bridge] delivery ${JSON.stringify({
            sessionId: event.sourceSessionId,
            eventId: event.eventId,
            offset: event.sourceOffset,
            attempt,
            status: attempt < MAX_RETRIES ? "retrying" : "failed",
            latencyMs,
            errorCode: lastErrorCode,
            error: truncate(message, 180),
          })}`,
        );

        if (attempt >= MAX_RETRIES) {
          break;
        }
        metrics.retries += 1;
      }

      await sleep(backoffDelay(attempt));
    }

    metrics.failed += 1;
    metrics.lastFailureAt = Date.now();
    await writeDeadLetter({
      timestamp: new Date().toISOString(),
      sessionId: event.sourceSessionId,
      eventId: event.eventId,
      sourceOffset: event.sourceOffset,
      payload: event,
      errorCode: lastErrorCode ?? "unknown_error",
      httpStatus: lastStatus,
      responseBody: lastResponseBody,
    });
    return false;
  } finally {
    metrics.pendingQueue = Math.max(0, metrics.pendingQueue - 1);
  }
}

function parseTranscriptEnvelope(line: string): TranscriptEnvelope | null {
  try {
    const parsed = JSON.parse(line);
    return isObject(parsed) ? (parsed as TranscriptEnvelope) : null;
  } catch {
    return null;
  }
}

async function readNewLines(
  filePath: string,
  startOffset: number,
): Promise<{
  lines: Array<{ sourceOffset: number; line: string }>;
  nextOffset: number;
  inode: number;
  mtimeMs: number;
}> {
  const fileStats = await stat(filePath);
  const inode = Number(fileStats.ino ?? 0);
  const mtimeMs = Math.floor(fileStats.mtimeMs);
  if (fileStats.size <= startOffset) {
    return { lines: [], nextOffset: startOffset, inode, mtimeMs };
  }

  const bytesToRead = Number(fileStats.size - startOffset);
  const buffer = Buffer.alloc(bytesToRead);
  const fileHandle = await open(filePath, "r");
  try {
    await fileHandle.read(buffer, 0, bytesToRead, startOffset);
  } finally {
    await fileHandle.close();
  }

  const chunk = buffer.toString("utf-8");
  const lastNewline = chunk.lastIndexOf("\n");
  if (lastNewline < 0) {
    return { lines: [], nextOffset: startOffset, inode, mtimeMs };
  }

  const completeChunk = chunk.slice(0, lastNewline + 1);
  const rawLines = completeChunk.split("\n");
  rawLines.pop();

  const lines: Array<{ sourceOffset: number; line: string }> = [];
  let consumedBytes = 0;
  for (const rawLine of rawLines) {
    const sourceOffset = startOffset + consumedBytes;
    consumedBytes += Buffer.byteLength(rawLine) + 1;
    const line = rawLine.trim();
    if (line.length === 0) continue;
    lines.push({ sourceOffset, line });
  }

  return {
    lines,
    nextOffset: startOffset + consumedBytes,
    inode,
    mtimeMs,
  };
}

async function processSessionFile(filePath: string, agentId: string): Promise<boolean> {
  try {
    const fileStats = await stat(filePath);
    const inode = Number(fileStats.ino ?? 0);

    const existingCursor = cursorState.get(filePath);
    let startOffset = existingCursor?.offset ?? 0;

    if (existingCursor) {
      const rotated = existingCursor.inode !== inode;
      const truncated = fileStats.size < existingCursor.offset;
      if (rotated || truncated) {
        startOffset = 0;
        console.log(
          `[bridge] cursor-reset ${JSON.stringify({
            filePath,
            reason: rotated ? "inode_changed" : "truncated",
          })}`,
        );
      }
    }

    const { lines, nextOffset, inode: nextInode, mtimeMs: nextMtimeMs } = await readNewLines(
      filePath,
      startOffset,
    );
    const sourceSessionId = basename(filePath, ".jsonl");

    for (const { sourceOffset, line } of lines) {
      const envelope = parseTranscriptEnvelope(line);
      if (!envelope) {
        logUnknownShapeOnce("invalid_json_line", line, sourceSessionId, sourceOffset);
        continue;
      }

      const events = mapEnvelopeToEvents(
        filePath,
        agentId,
        sourceSessionId,
        sourceOffset,
        envelope,
      );
      for (const event of events) {
        await deliverEvent(event);
      }
    }

    const nextCursor: CursorEntry = {
      offset: nextOffset,
      inode: nextInode,
      mtimeMs: nextMtimeMs,
      key: buildCursorKey(filePath, nextInode, nextMtimeMs),
      updatedAt: Date.now(),
    };
    const previousCursorJson = JSON.stringify(existingCursor ?? null);
    const nextCursorJson = JSON.stringify(nextCursor);
    cursorState.set(filePath, nextCursor);
    return previousCursorJson !== nextCursorJson;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      console.error(`[bridge] Failed processing file ${filePath}:`, error);
    }
    return false;
  }
}

async function scanAgents() {
  metrics.scans += 1;
  let scannedFiles = 0;
  let cursorStateChanged = false;

  try {
    const agentDirs = await readdir(OPENCLAW_AGENTS_DIR, { withFileTypes: true });
    for (const dir of agentDirs) {
      if (!dir.isDirectory()) continue;
      const agentId = dir.name;
      const sessionsDir = join(OPENCLAW_AGENTS_DIR, agentId, "sessions");

      let sessionFiles: string[] = [];
      try {
        sessionFiles = await readdir(sessionsDir);
      } catch {
        continue;
      }

      const jsonlFiles = sessionFiles.filter((file) => file.endsWith(".jsonl")).sort();
      for (const fileName of jsonlFiles) {
        scannedFiles += 1;
        const changed = await processSessionFile(join(sessionsDir, fileName), agentId);
        cursorStateChanged = cursorStateChanged || changed;
      }
    }
  } catch (error) {
    console.error("[bridge] Agent scan error:", error);
  } finally {
    metrics.scannedFiles = scannedFiles;
    if (cursorStateChanged) {
      await persistCursorState();
    }
  }
}

function heartbeatSnapshot() {
  const attempts = metrics.delivered + metrics.failed;
  const successRate = attempts === 0 ? "100.0%" : `${((metrics.delivered / attempts) * 100).toFixed(1)}%`;
  return {
    scans: metrics.scans,
    scannedFiles: metrics.scannedFiles,
    queueDepth: metrics.pendingQueue,
    delivered: metrics.delivered,
    failed: metrics.failed,
    retries: metrics.retries,
    successRate,
    lastSuccessAt: metrics.lastSuccessAt ? new Date(metrics.lastSuccessAt).toISOString() : null,
    lastFailureAt: metrics.lastFailureAt ? new Date(metrics.lastFailureAt).toISOString() : null,
  };
}

async function runScan() {
  if (scanInFlight) return;
  scanInFlight = true;
  try {
    await scanAgents();
  } finally {
    scanInFlight = false;
  }
}

function setupShutdownHandlers() {
  const shutdown = async (signal: NodeJS.Signals) => {
    console.log(`[bridge] Received ${signal}, persisting cursor state before exit.`);
    await persistCursorState();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

async function main() {
  await loadCursorState();
  setupShutdownHandlers();

  console.log("[bridge] Starting OpenClaw → Convex bridge");
  console.log(`[bridge] Watching: ${OPENCLAW_AGENTS_DIR}`);
  console.log(`[bridge] Pushing to: ${CONVEX_SITE_URL}`);
  console.log(`[bridge] Cursor state: ${BRIDGE_STATE_PATH}`);
  console.log(`[bridge] Dead-letter path: ${BRIDGE_DEAD_LETTER_PATH}`);

  setInterval(() => {
    console.log(`[bridge] heartbeat ${JSON.stringify(heartbeatSnapshot())}`);
  }, HEARTBEAT_INTERVAL_MS);

  setInterval(() => {
    void runScan();
  }, POLL_INTERVAL_MS);

  await runScan();
}

void main();
