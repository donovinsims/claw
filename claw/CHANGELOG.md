# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Comprehensive repository documentation refresh:
  - new architecture, API, data model, development, and operations docs
  - new docs index and AI-oriented `llms.txt`

### Changed

- Replaced default Next.js README with project-specific onboarding and references.
- Synced docs with current task lifecycle behavior (soft-archive, ingest lineage fields, and Telegram instruction auto-tracking).

## [0.1.0] - 2026-02-21

### Added

- Initial Mission Control dashboard implementation with Next.js + Convex.
- Core dashboard panels (agents, mission queue, live feed, standup, calendar, search).
- OpenClaw transcript bridge service and Convex HTTP ingest route.
