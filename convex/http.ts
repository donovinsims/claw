import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();
const SIGNATURE_HEADER = "x-openclaw-signature";

type SignatureMode = "warn" | "enforce";

type BridgeHookPayload = {
  eventId: string;
  event: string;
  agentId: string;
  sourceSessionId: string;
  sourceOffset: number;
  data: Record<string, unknown>;
};

function resolveSignatureMode(): SignatureMode {
  const configured = (process.env.OPENCLAW_HOOK_SIGNATURE_MODE ?? "").toLowerCase();
  if (configured === "warn") return "warn";
  if (configured === "enforce") return "enforce";
  return process.env.NODE_ENV === "development" ? "warn" : "enforce";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSignatureHeader(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("sha256=")) return trimmed.slice("sha256=".length);
  return trimmed;
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function replaceLoneSurrogates(str: string): string {
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += str[i] + str[i + 1];
        i++;
      } else {
        out += "\uFFFD";
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      out += "\uFFFD";
    } else {
      out += str[i];
    }
  }
  return out;
}

function sanitizeDeep(value: unknown): unknown {
  if (typeof value === "string") return replaceLoneSurrogates(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeDeep(v);
    }
    return out;
  }
  return value;
}

function isBridgeHookPayload(value: unknown): value is BridgeHookPayload {
  if (!isRecord(value)) return false;
  if (typeof value.eventId !== "string") return false;
  if (typeof value.event !== "string") return false;
  if (typeof value.agentId !== "string") return false;
  if (typeof value.sourceSessionId !== "string") return false;
  if (typeof value.sourceOffset !== "number") return false;
  if (!isRecord(value.data)) return false;
  return true;
}

// OpenClaw Hook Bridge endpoint — receives POSTs from the JSONL bridge service
http.route({
  path: "/api/openclaw-hook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signatureMode = resolveSignatureMode();
    const hookSecret = process.env.OPENCLAW_HOOK_SECRET;
    const providedSignature = normalizeSignatureHeader(request.headers.get(SIGNATURE_HEADER));

    if (!hookSecret && signatureMode === "enforce") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Server misconfigured: OPENCLAW_HOOK_SECRET is required in enforce mode.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (hookSecret) {
      const expectedSignature = await hmacSha256Hex(hookSecret, rawBody);
      const validSignature = providedSignature !== null &&
        constantTimeEqual(providedSignature, expectedSignature);
      if (!validSignature) {
        if (signatureMode === "warn") {
          console.warn(
            `[openclaw-hook] Signature validation failed in warn mode.`,
          );
        } else {
          return new Response(
            JSON.stringify({ ok: false, error: "Unauthorized webhook signature." }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }
    } else if (signatureMode === "warn") {
      console.warn("[openclaw-hook] OPENCLAW_HOOK_SECRET not set; request accepted in warn mode.");
    }

    let body: unknown;
    try {
      body = sanitizeDeep(JSON.parse(rawBody));
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON payload." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isBridgeHookPayload(body)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid payload contract." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await ctx.runMutation(api.mutations.ingestBridgeEvent, body);

    return new Response(JSON.stringify({ ok: true, duplicated: result.duplicated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
