import type { AgentVisualStyle } from "./types";

export const AGENT_STYLE_KEY = "mc.agentStyles.v4";

export const AGENT_STYLE_PRESETS: Array<AgentVisualStyle & { id: string; name: string }> = [
  {
    id: "google-blue",
    name: "Google Blue",
    accent: "#4285f4",
    gradient:
      "radial-gradient(130% 120% at 0% 0%, rgba(126,181,255,.96) 0%, rgba(66,133,244,.42) 44%, rgba(15,40,92,.06) 72%), linear-gradient(145deg, #1a3f86 0%, #4285f4 52%, #2f66c2 100%)",
  },
  {
    id: "google-red",
    name: "Google Red",
    accent: "#ea4335",
    gradient:
      "radial-gradient(130% 120% at 0% 0%, rgba(255,140,125,.94) 0%, rgba(234,67,53,.44) 44%, rgba(96,26,21,.08) 72%), linear-gradient(145deg, #7d2b23 0%, #ea4335 52%, #b6362b 100%)",
  },
  {
    id: "google-yellow",
    name: "Google Yellow",
    accent: "#fbbc05",
    gradient:
      "radial-gradient(130% 120% at 0% 0%, rgba(255,226,128,.96) 0%, rgba(251,188,5,.42) 44%, rgba(104,73,3,.08) 72%), linear-gradient(145deg, #9a6e04 0%, #fbbc05 52%, #c48f03 100%)",
  },
  {
    id: "google-green",
    name: "Google Green",
    accent: "#34a853",
    gradient:
      "radial-gradient(130% 120% at 0% 0%, rgba(141,243,170,.94) 0%, rgba(52,168,83,.42) 44%, rgba(16,72,34,.07) 72%), linear-gradient(145deg, #236f39 0%, #34a853 52%, #2b8743 100%)",
  },
  {
    id: "google-cyan",
    name: "Google Cyan",
    accent: "#24c1e0",
    gradient:
      "radial-gradient(130% 120% at 0% 0%, rgba(153,236,255,.95) 0%, rgba(36,193,224,.42) 44%, rgba(14,63,77,.07) 72%), linear-gradient(145deg, #1c6c80 0%, #24c1e0 52%, #1c9ab2 100%)",
  },
  {
    id: "google-spectrum",
    name: "Google Spectrum",
    accent: "#6ba7f7",
    gradient:
      "radial-gradient(130% 120% at 0% 0%, rgba(255,255,255,.2) 0%, rgba(255,255,255,0) 55%), linear-gradient(145deg, #3476e4 0%, #34a853 28%, #fbbc05 62%, #ea4335 100%)",
  },
];

const LEGACY_ACCENT_TO_PRESET: Record<string, string> = {
  "#4285f4": "google-blue",
  "#ea4335": "google-red",
  "#fbbc05": "google-yellow",
  "#34a853": "google-green",
  "#24c1e0": "google-cyan",
  "#6ba7f7": "google-spectrum",
  "#2f5bff": "google-blue",
  "#00b7c9": "google-cyan",
  "#00b86b": "google-green",
  "#ff9f1c": "google-yellow",
  "#ff4d9d": "google-red",
  "#5b5fff": "google-blue",
  "#4f6fe8": "google-blue",
  "#1f9aa4": "google-cyan",
  "#2f9f6a": "google-green",
  "#c7821f": "google-yellow",
  "#c84b88": "google-red",
  "#6d63e8": "google-blue",
};

function hashAgentId(agentId: string): number {
  let hash = 0;
  for (let index = 0; index < agentId.length; index += 1) {
    hash = (hash * 31 + agentId.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function isAgentVisualStyle(value: unknown): value is AgentVisualStyle {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.accent === "string" && typeof candidate.gradient === "string";
}

function migrateLegacyStyle(style: AgentVisualStyle): AgentVisualStyle {
  const legacyPresetId = LEGACY_ACCENT_TO_PRESET[style.accent.toLowerCase()];
  if (!legacyPresetId) return style;
  return AGENT_STYLE_PRESETS.find((preset) => preset.id === legacyPresetId) ?? style;
}

export function deterministicAgentStyle(agentId: string): AgentVisualStyle {
  const index = hashAgentId(agentId) % AGENT_STYLE_PRESETS.length;
  return AGENT_STYLE_PRESETS[index];
}

export function readStoredAgentStyles(): Record<string, AgentVisualStyle> {
  if (typeof window === "undefined") return {};

  const raw = window.localStorage.getItem(AGENT_STYLE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sanitized: Record<string, AgentVisualStyle> = {};

    for (const [agentId, style] of Object.entries(parsed)) {
      if (isAgentVisualStyle(style)) {
        sanitized[agentId] = migrateLegacyStyle(style);
      }
    }

    return sanitized;
  } catch {
    return {};
  }
}

export function resolveAgentStyle(
  agentId: string,
  storedStyles?: Record<string, AgentVisualStyle>,
): AgentVisualStyle {
  const inMemoryStyles = storedStyles ?? readStoredAgentStyles();
  return inMemoryStyles[agentId] ?? deterministicAgentStyle(agentId);
}

export function writeStoredAgentStyles(styles: Record<string, AgentVisualStyle>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AGENT_STYLE_KEY, JSON.stringify(styles));
  window.dispatchEvent(new Event("agent-style-updated"));
}
