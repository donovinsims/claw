# Claw Documentation

Central documentation for the Claw Mission Control repository.

## Start Here

- [README](../README.md) for quick setup and project overview.
- [Development Guide](./development.md) for local workflows.

## Core Technical Docs

- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Data Model](./data-model.md)
- [Operations](./operations.md)

## Repository Structure

```text
.
├── src/                # Next.js UI and dashboard components
├── convex/             # Convex schema, queries, mutations, HTTP actions
├── bridge/             # OpenClaw transcript -> Convex event bridge
├── infra/              # Cloudflare tunnel helper files
├── docs/               # Documentation
└── README.md           # Project entry point
```
