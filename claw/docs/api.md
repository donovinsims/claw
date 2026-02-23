# API Reference

This project uses Convex functions as its primary backend API surface, plus one HTTP ingest endpoint.

## HTTP Endpoint

### `POST /api/openclaw-hook`

Hosted by Convex site URL (`https://<deployment>.convex.site/api/openclaw-hook`).

Purpose:
- Receive bridge events from local OpenClaw transcript processing
- Route them through idempotent ingest mutation (`mutations.ingestBridgeEvent`)

Required header:

```text
x-openclaw-signature: sha256=<hex-hmac>
```

Signature details:
- Algorithm: HMAC SHA-256
- Message: raw HTTP request body bytes
- Secret: `OPENCLAW_HOOK_SECRET` (shared by bridge and Convex deployment)
- Validation mode: `OPENCLAW_HOOK_SIGNATURE_MODE` (`enforce` or `warn`)

Request body:

```json
{
  "eventId": "sha256hex",
  "event": "activity",
  "agentId": "jarvis",
  "sourceSessionId": "ee4c06e6-f907-4d10-8536-9cdf4ec6dfcd",
  "sourceOffset": 12345,
  "data": {
    "type": "comment",
    "message": "Working on task..."
  }
}
```

Supported `event` values:

| Event | Behavior |
|---|---|
| `task.created` | Calls `mutations.createTask` |
| `task.status_changed` | Calls `mutations.updateTaskStatus` when `data.taskId` is present |
| `agent.status_changed` | Calls `mutations.updateAgentStatus` |
| `activity` | Calls `mutations.logActivity` |
| any other value | Logged as `system` activity event |

Response:

```json
{ "ok": true, "duplicated": false }
```

## Convex Queries

Defined in `convex/queries.ts`.

### `getAgents`

- Args: none
- Returns: all agent documents

### `getAgentByAgentId`

- Args:

| Name | Type | Required | Description |
|---|---|---|---|
| `agentId` | `string` | Yes | Logical agent ID (not Convex document ID) |

- Returns: matching agent or `null`

### `getTasksByStatus`

- Args: none
- Returns: object keyed by status containing arrays of tasks (soft-archived tasks are excluded)

### `getActivityFeed`

- Args:

| Name | Type | Required | Description |
|---|---|---|---|
| `limit` | `number` | No | Max events (default 50) |
| `type` | `string` | No | Filter by event type |
| `agentId` | `string` | No | Filter by agent ID |

- Returns: descending list by `createdAt`

### `getLatestStandup`

- Args: none
- Returns: latest standup snapshot or `null`

### `getSetting`

- Args:

| Name | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | Yes | Setting key |

- Returns: setting row or `null`

### `getDashboardStats`

- Args: none
- Returns:
  - `agentsActive`
  - `agentsTotal`
  - `tasksInQueue` (non-archived tasks where status is not `done`)
  - `tasksCompleted` (non-archived tasks where status is `done`)

## Convex Mutations

Defined in `convex/mutations.ts`.

### Agent Mutations

#### `upsertAgent`

- Creates or updates an agent by `agentId`
- Updates `lastActive` on write
- Initializes `tasksCompleted` for new agents

#### `updateAgentStatus`

- Updates `status`, optional `currentTask`, and `lastActive`

### Task Mutations

#### `createTask`

- Creates task with auto status:
  - `assigned` when `assignee` is provided
  - otherwise `inbox`
- Accepts optional ingest lineage fields (`sessionKey`, `sourceOffset`) and optional explicit `status`

#### `updateTaskStatus`

- Updates status and optional assignee
- Sets `completedAt` when status becomes `done`
- Increments agent `tasksCompleted` for completed assigned tasks

#### `moveTask`

- Lightweight status transition mutation used by Kanban drag-and-drop
- Sets `completedAt` when moved to `done`

#### `archiveTask`

- Soft-archives a task by setting `archivedAt` and `updatedAt`
- Archived tasks are filtered out by `getTasksByStatus` and `getDashboardStats`

### Activity / Settings / Standup

#### `logActivity`

- Appends a new `activityEvents` row

#### `ingestBridgeEvent`

- Performs webhook event routing in one mutation
- Deduplicates by `eventId` via table `bridge_ingest_dedupe`
- For `activity` events, may auto-track Telegram instruction lifecycle:
  - auto-create in-progress instruction tasks for Telegram user instructions
  - auto-complete latest open Telegram instruction task on assistant completion signals
- Returns `{ ok: true, duplicated: boolean }`

#### `updateSetting`

- Upserts key/value setting (used by mission statement editor)

#### `generateStandup`

- Builds daily standup snapshot from task/activity state for a given date

## Frontend Usage Pattern

The dashboard calls Convex functions directly from React components:

```tsx
const tasksByStatus = useQuery(api.queries.getTasksByStatus);
const moveTask = useMutation(api.mutations.moveTask);
```

## Data Contracts

Canonical contracts live in:

- `convex/schema.ts`
- generated types in `convex/_generated/dataModel.d.ts`
