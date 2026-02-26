# Cleanup Backlog

**Date:** 2026-02-26

## P0 (Critical/High Priority)
- Remove unused dependencies (`framer-motion`, `date-fns`, `zod`, `@hookform/resolvers`) after verifying they are truly unreferenced in the UI.
- Add `typecheck` (`tsc --noEmit`) to `package.json` scripts to verify build integrity.

## P1 (Medium Priority)
- Standardize the process management. Move all long-running processes (including the Gateway) into the PM2 `ecosystem.config.js` to avoid fragmented launchd scripts.

## P2 (Low Priority)
- Clean up unused devDependencies where Tailwind v4 makes them obsolete.