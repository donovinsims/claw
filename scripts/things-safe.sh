#!/usr/bin/env bash
set -euo pipefail

# Things 3 Safety Wrapper
# Hard rule: never touch Things DB files directly.
# Allowed writes: Things URL scheme only.

LOG_FILE="$HOME/OpenClaw/workspaces/lead/artifacts/things-safe.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Optional local secret file (not committed)
SECRETS_FILE="$HOME/.openclaw/secrets/things.env"
if [[ -f "$SECRETS_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
fi

FORBIDDEN_RE='sqlite|\.sqlite|thingsdata|\.db|group containers|mobile documents|library/.*/things|direct[-_ ]?db|vacuum|pragma|attach database'

die() { echo "[things-safe] ERROR: $*" >&2; exit 1; }

urlencode() {
  python3 - <<'PY' "$1"
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1], safe=''))
PY
}

guard_text() {
  local text="${1:-}"
  if echo "$text" | tr '[:upper:]' '[:lower:]' | grep -Eq "$FORBIDDEN_RE"; then
    die "Blocked unsafe content (possible DB/path operation)."
  fi
}

redact_url() {
  local u="$1"
  echo "$u" | sed -E 's/(auth-token=)[^&]*/\1REDACTED/g'
}

ensure_auth_token() {
  local u="$1"
  if [[ "$u" == *"auth-token="* ]]; then
    echo "$u"
    return
  fi

  [[ -n "${THINGS_AUTH_TOKEN:-}" ]] || die "Missing THINGS_AUTH_TOKEN. Add it to ~/.openclaw/secrets/things.env"
  local sep='?'
  [[ "$u" == *"?"* ]] && sep='&'
  echo "${u}${sep}auth-token=$(urlencode "$THINGS_AUTH_TOKEN")"
}

run_url() {
  local url="$1"
  local dry="${2:-false}"
  guard_text "$url"
  [[ "$url" =~ ^things:// ]] || die "URL must start with things://"

  url="$(ensure_auth_token "$url")"
  local safe_url
  safe_url="$(redact_url "$url")"

  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$ts] $safe_url" >> "$LOG_FILE"

  if [[ "$dry" == "true" ]]; then
    echo "$safe_url"
  else
    open "$url"
    echo "[things-safe] sent: $safe_url"
  fi
}

build_update_url() {
  local id="$1"; shift
  [[ -n "$id" ]] || die "--id required"
  local qs="id=$(urlencode "$id")"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --heading)
        guard_text "$2"; qs+="&heading=$(urlencode "$2")"; shift 2 ;;
      --add-tag)
        guard_text "$2"; qs+="&add-tags=$(urlencode "$2")"; shift 2 ;;
      --append-notes)
        guard_text "$2"; qs+="&append-notes=$(urlencode "$2")"; shift 2 ;;
      --notes)
        guard_text "$2"; qs+="&notes=$(urlencode "$2")"; shift 2 ;;
      --completed)
        [[ "$2" == "true" || "$2" == "false" ]] || die "--completed must be true|false"
        qs+="&completed=$2"; shift 2 ;;
      *) die "Unknown update option: $1" ;;
    esac
  done

  echo "things:///update?$qs"
}

build_add_url() {
  local title="$1"; shift
  [[ -n "$title" ]] || die "title required"
  guard_text "$title"

  local qs="title=$(urlencode "$title")"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --notes)
        guard_text "$2"; qs+="&notes=$(urlencode "$2")"; shift 2 ;;
      --when)
        guard_text "$2"; qs+="&when=$(urlencode "$2")"; shift 2 ;;
      --deadline)
        guard_text "$2"; qs+="&deadline=$(urlencode "$2")"; shift 2 ;;
      --list)
        guard_text "$2"; qs+="&list=$(urlencode "$2")"; shift 2 ;;
      --heading)
        guard_text "$2"; qs+="&heading=$(urlencode "$2")"; shift 2 ;;
      --tags)
        guard_text "$2"; qs+="&tags=$(urlencode "$2")"; shift 2 ;;
      *) die "Unknown add option: $1" ;;
    esac
  done

  echo "things:///add?$qs"
}

usage() {
  cat <<'EOF'
Usage:
  things-safe.sh update --id <TASK_ID> [--heading "In Progress"] [--add-tag claimed] [--append-notes "..."] [--completed true|false] [--dry-run]

Prereq:
  Set THINGS_AUTH_TOKEN in env, or create ~/.openclaw/secrets/things.env with:
  export THINGS_AUTH_TOKEN="..."
  things-safe.sh add "Task title" [--notes "..."] [--when today] [--deadline YYYY-MM-DD] [--list "Project"] [--heading "Section"] [--tags "a,b"] [--dry-run]
  things-safe.sh url "things:///update?..." [--dry-run]

Examples:
  things-safe.sh update --id abc-123 --heading "In Progress" --add-tag claimed --append-notes "[START] Claimed at 10:32"
  things-safe.sh update --id abc-123 --heading "Review Needed" --add-tag needs-review
  things-safe.sh update --id abc-123 --completed true --append-notes "[DONE] Completed"
  things-safe.sh add "Write content" --list "Bot Output" --tags "needs-review"
EOF
}

main() {
  [[ $# -gt 0 ]] || { usage; exit 1; }

  local cmd="$1"; shift
  local dry="false"

  # pull --dry-run from end if present
  if [[ "${*: -1}" == "--dry-run" ]]; then
    dry="true"
    set -- "${@:1:$(($#-1))}"
  fi

  case "$cmd" in
    update)
      local id=""
      if [[ "${1:-}" == "--id" ]]; then id="$2"; shift 2; else die "update requires --id"; fi
      local url
      url="$(build_update_url "$id" "$@")"
      run_url "$url" "$dry"
      ;;
    add)
      local title="${1:-}"
      [[ -n "$title" ]] || die "add requires title"
      shift
      local url
      url="$(build_add_url "$title" "$@")"
      run_url "$url" "$dry"
      ;;
    url)
      local url="${1:-}"
      [[ -n "$url" ]] || die "url requires a things:// URL"
      run_url "$url" "$dry"
      ;;
    -h|--help|help)
      usage ;;
    *)
      die "Unknown command: $cmd" ;;
  esac
}

main "$@"
