# Data Model

Convex schema is defined in `convex/schema.ts`.

## Tables

### `agents`

Purpose:
- Registry of known agents and runtime metadata.

Key fields:

| Field | Type | Notes |
|---|---|---|
| `agentId` | `string` | Stable external agent ID |
| `name` | `string` | Display name |
| `role` | `string?` | Optional role text |
| `level` | `string?` | Usually `LEAD`, `SPC`, `INT` |
| `status` | `string` | `working`, `idle`, `error`, `offline` |
| `lastActive` | `number?` | Unix ms timestamp |
| `currentTask` | `string?` | Optional active task summary |
| `icon` | `string?` | Icon name used by UI |
| `tasksCompleted` | `number?` | Completion counter |
| `prompt` | `string?` | Agent prompt text |
| `model` | `string?` | Model identifier |

Indexes:
- `by_agentId`
- `by_status`

### `tasks`

Purpose:
- Mission queue items displayed in Kanban board.

Key fields:

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Task title |
| `description` | `string?` | Optional detail |
| `status` | `string` | `inbox`, `assigned`, `in_progress`, `review`, `done` |
| `priority` | `string` | `high`, `normal`, `low` (convention) |
| `assignee` | `string?` | Agent ID |
| `tags` | `string[]` | Display tags |
| `createdAt` | `number` | Unix ms |
| `updatedAt` | `number` | Unix ms |
| `completedAt` | `number?` | Set when done |
| `sourceMessage` | `string?` | Original message text |
| `sessionKey` | `string?` | Upstream session key |

Indexes:
- `by_status`
- `by_assignee`
- `by_priority`
- `by_updatedAt`

### `activityEvents`

Purpose:
- Realtime feed entries for operator visibility and audit context.

Key fields:

| Field | Type | Notes |
|---|---|---|
| `type` | `string` | e.g. `comment`, `decision`, `status_change` |
| `agentId` | `string` | Agent/system actor |
| `message` | `string` | Human-readable event text |
| `metadata` | `any?` | Optional structured payload |
| `createdAt` | `number` | Unix ms |

Indexes:
- `by_type`
- `by_agentId`
- `by_createdAt`

### `standups`

Purpose:
- Daily snapshot document for standup modal.

Key fields:

| Field | Type | Notes |
|---|---|---|
| `date` | `string` | ISO date (`YYYY-MM-DD`) |
| `completed` | `[{agentId, task}]` | Completed today |
| `inProgress` | `[{agentId, task}]` | In-progress items |
| `blocked` | `[{agentId, task}]` | Blockers |
| `needsReview` | `[{agentId, task}]` | Awaiting review |
| `decisions` | `[{agentId, task}]` | Decision summaries |
| `createdAt` | `number` | Snapshot creation time |

Indexes:
- `by_date`

### `settings`

Purpose:
- Small key/value store for app-level settings.

Key fields:

| Field | Type | Notes |
|---|---|---|
| `key` | `string` | Unique setting key |
| `value` | `string` | Value payload |
| `updatedAt` | `number` | Unix ms |

Indexes:
- `by_key`

## Status Vocabulary

Task status values used in UI and mutations:
- `inbox`
- `assigned`
- `in_progress`
- `review`
- `done`

Agent status values used in UI and mutations:
- `idle`
- `working`
- `error`
- `offline`
