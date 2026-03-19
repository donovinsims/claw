#!/usr/bin/env bash
set -euo pipefail

SAFE="$HOME/OpenClaw/workspaces/lead/scripts/things-safe.sh"
[[ -x "$SAFE" ]] || { echo "Missing $SAFE" >&2; exit 1; }

ts() { date '+%H:%M'; }
DRY="${THINGS_DRY_RUN:-0}"

safe() {
  if [[ "$DRY" == "1" ]]; then
    "$SAFE" "$@" --dry-run
  else
    "$SAFE" "$@"
  fi
}

usage() {
  cat <<'EOF'
Things Bot Safe Cycle

Commands:
  poll [query] [limit]
      Read-only helper (no writes). Uses things CLI if available.

  claim <TASK_ID> <BOT_NAME>
      Move task to In Progress, add claimed tag, append START log.

  progress <TASK_ID> <BOT_NAME> <MESSAGE>
      Append milestone note.

  review <TASK_ID> <BOT_NAME> [MESSAGE]
      Move to Review Needed + add needs-review tag.

  done <TASK_ID> <BOT_NAME> [MESSAGE]
      Mark completed + append DONE log.

  assign <TITLE> <LIST> <HEADING> [TAGS]
      Create a handoff task (bot-to-bot safe path).

Examples:
  THINGS_DRY_RUN=1 scripts/things-bot-safe-cycle.sh claim abcd-1234 "Bot 1"
  scripts/things-bot-safe-cycle.sh claim abcd-1234 "Bot 1"
  scripts/things-bot-safe-cycle.sh progress abcd-1234 "Bot 1" "Milestone: draft complete"
  scripts/things-bot-safe-cycle.sh review abcd-1234 "Bot 1" "Needs human approval"
  scripts/things-bot-safe-cycle.sh done abcd-1234 "Bot 1" "Published"
  scripts/things-bot-safe-cycle.sh assign "Write content from research" "Bot 1" "Queued" "handoff,solo"
EOF
}

cmd="${1:-help}"; shift || true

case "$cmd" in
  poll)
    q="${1:-Queued}"
    n="${2:-20}"
    if command -v things >/dev/null 2>&1; then
      echo "[read-only] things search \"$q\" --limit $n"
      things search "$q" --limit "$n"
    else
      echo "things CLI not installed. Poll manually in Things app: filter by heading 'Queued'."
    fi
    ;;

  claim)
    id="${1:-}"; bot="${2:-}"
    [[ -n "$id" && -n "$bot" ]] || { usage; exit 1; }
    safe update --id "$id" \
      --heading "In Progress" \
      --add-tag "claimed" \
      --append-notes "[START] $bot claimed at $(ts)"
    ;;

  progress)
    id="${1:-}"; bot="${2:-}"; msg="${3:-}"
    [[ -n "$id" && -n "$bot" && -n "$msg" ]] || { usage; exit 1; }
    safe update --id "$id" --append-notes "[PROGRESS] $bot $(ts): $msg"
    ;;

  review)
    id="${1:-}"; bot="${2:-}"; msg="${3:-Ready for review}"
    [[ -n "$id" && -n "$bot" ]] || { usage; exit 1; }
    safe update --id "$id" \
      --heading "Review Needed" \
      --add-tag "needs-review" \
      --append-notes "[REVIEW] $bot $(ts): $msg"
    ;;

  done)
    id="${1:-}"; bot="${2:-}"; msg="${3:-Completed}"
    [[ -n "$id" && -n "$bot" ]] || { usage; exit 1; }
    safe update --id "$id" \
      --completed true \
      --append-notes "[DONE] $bot $(ts): $msg"
    ;;

  assign)
    title="${1:-}"; list="${2:-}"; heading="${3:-}"; tags="${4:-handoff}"
    [[ -n "$title" && -n "$list" && -n "$heading" ]] || { usage; exit 1; }
    safe add "$title" --list "$list" --heading "$heading" --tags "$tags"
    ;;

  -h|--help|help)
    usage
    ;;

  *)
    echo "Unknown command: $cmd" >&2
    usage
    exit 1
    ;;
esac
