# Deck Builder (Mobile Web) — React + dnd-kit

Touch-first deck building UI for the mobile web built with React, TypeScript, Vite, and dnd-kit.

Features include:

- History state with undo/redo. Drag operations are ephemeral until drop; only final drops are committed to history.
- Hard page scroll lock. The page never scrolls; an internal `.content` container scrolls instead. Zones themselves are scrollable.
- Drag cards between zones and reorder inside zones with a placeholder gap.
- Edge auto-scroll near zone edges during drag.
- Accessibility announcements and keyboard drag support.

## Quick start

```bash
npm install
npm run dev
```

## Deployment

The project includes a `netlify.toml` configuration so Netlify can build and
serve the app as a single-page application. Deploys should use Node 18, run
`npm run build`, and publish the `dist/` directory.

## Key files

- `src/state/useHistoryState.ts` — baselined history with `setEphemeral`, `commit`, `undo`, `redo`.
- `src/util/scrollLock.tsx` — page scroll lock mounted at the app root.
- `src/dnd/useEdgeAutoScroll.ts` — edge-scrolling helper.
- `src/App.tsx` — integrates history and scroll lock with dnd-kit.
