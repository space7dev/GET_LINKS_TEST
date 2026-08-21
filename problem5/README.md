# Crude Server

A small, production-minded CRUD API for task resources, built with Express 5,
TypeScript, Zod, and SQLite.

## Design highlights

- Express 5 with strict TypeScript configuration
- Durable SQLite storage with versioned, transactional migrations
- Controller/service/repository separation
- Request validation and consistent JSON errors
- Filtering, text search, sorting, and offset pagination
- Structured logs with sensitive-header redaction
- Graceful shutdown and integration tests against an isolated in-memory database

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

No separately installed database is required.

## Setup and run

```bash
npm install
```

The defaults are sufficient for local development. To customize them, copy
`.env.example` to `.env` and export/load those variables in your shell. The
application reads standard environment variables directly.

```bash
# Development, with file watching
npm run dev

# Production-style build and run
npm run build
npm start
```

The API listens on `http://localhost:3000` by default. SQLite data is created at
`./data/app.db`; its parent directory is created automatically.

### Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `3000` | HTTP port |
| `DATABASE_PATH` | `./data/app.db` | SQLite file path; use `:memory:` for ephemeral storage |
| `LOG_LEVEL` | `info` | Pino log level |

## API

All resource responses use `{ "data": ... }`. List responses also include a
`pagination` object. Errors use `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/tasks` | Create a task |
| `GET` | `/api/v1/tasks` | List and filter tasks |
| `GET` | `/api/v1/tasks/:id` | Get one task |
| `PATCH` | `/api/v1/tasks/:id` | Partially update a task |
| `DELETE` | `/api/v1/tasks/:id` | Delete a task (`204`) |
| `GET` | `/health` | Liveness endpoint |

### Task fields

- `title`: required string, 1–200 characters
- `description`: optional string or `null`, up to 2,000 characters
- `status`: `pending` (default), `in_progress`, or `completed`
- `priority`: `low`, `medium` (default), or `high`
- `dueDate`: optional ISO 8601 date-time with timezone, or `null`

Server-managed fields are `id`, `createdAt`, and `updatedAt`.

### Examples

Create a task:

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Ship API","priority":"high","dueDate":"2026-09-01T17:00:00Z"}'
```

List high-priority tasks whose title or description contains `api`:

```bash
curl "http://localhost:3000/api/v1/tasks?priority=high&search=api&limit=20&offset=0&sort=createdAt&order=desc"
```

Supported list parameters:

- `status`, `priority`: exact-match filters
- `search`: case-insensitive title/description substring search
- `limit`: 1–100, default 20
- `offset`: non-negative integer, default 0
- `sort`: `createdAt`, `updatedAt`, `title`, or `dueDate`
- `order`: `asc` or `desc`

Update and delete:

```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/TASK_UUID \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'

curl -X DELETE http://localhost:3000/api/v1/tasks/TASK_UUID
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

The integration suite covers the full CRUD lifecycle, filtering/search,
pagination, validation, and not-found behavior.

## Trade-offs and next production steps

SQLite is an intentional fit for a single-instance assessment service. For a
horizontally scaled deployment, replace the repository with PostgreSQL while
keeping the HTTP and service layers. Authentication/authorization, rate
limiting, OpenAPI generation, cursor pagination, metrics, and container/deploy
configuration would be the next additions once their requirements are known.
