# Codebase Audit

**Date:** 2026-02-26

## Overview
A review of the `claw` repository was conducted to assess dependencies, scripts, and overall architecture.

## Findings
1. **Dependencies:**
   - Evaluated `package.json` with `depcheck`. Found likely unused dependencies: `@hookform/resolvers`, `date-fns`, `framer-motion`, `zod`.
   - `tailwindcss` v4 is present and handles PostCSS directly, so some PostCSS-related devDependencies might be redundant or correctly configured depending on the new Tailwind v4 ecosystem.

2. **Process Management:**
   - `ecosystem.config.js` exists and correctly manages `claw-dashboard` and `claw-bridge`.
   - However, the `openclaw-gateway` (which runs the Telegram bot) is NOT in PM2. It is currently being run via an isolated macOS `launchd` plist.

3. **Scripts & Tooling:**
   - Missing explicit `typecheck` script. We have `eslint`, but no `tsc --noEmit` script to guarantee type safety before commits.