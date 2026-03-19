# Things Safe Wrapper

Use `scripts/things-safe.sh` for all automated Things writes.

## Why
- Blocks dangerous inputs that look like direct DB/path operations.
- Only permits `things://` URL-scheme actions.
- Logs all attempted/sent URLs to `artifacts/things-safe.log`.

## Commands

```bash
# Claim task
scripts/things-safe.sh update --id <TASK_ID> \
  --heading "In Progress" \
  --add-tag claimed \
  --append-notes "[START] Claimed at 10:32"

# Move to review
scripts/things-safe.sh update --id <TASK_ID> \
  --heading "Review Needed" \
  --add-tag needs-review

# Complete task
scripts/things-safe.sh update --id <TASK_ID> \
  --completed true \
  --append-notes "[DONE] Completed at 10:45"

# Add task
scripts/things-safe.sh add "Write content based on research" \
  --list "Bot 1" --heading "Queued" --tags "handoff"

# Dry run (prints URL, does not open Things)
scripts/things-safe.sh update --id <TASK_ID> --heading "In Progress" --dry-run
```

## Hard Rule
Never write directly to the Things database file. Use only approved methods:
- Things app UI
- Things URL scheme
- AppleScript
- Shortcuts
- Mail to Things
