<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Background

The global site background is a pure CSS iridescent shimmer — no canvas, no JS.

- **Where**: `app/globals.css` — `body::before` and `body::after` pseudo-elements
- **Stacking context**: `html` carries `background-color: var(--background)`; `body` is `isolation: isolate; background-color: transparent` so `z-index: -1` pseudo-elements land between html's color and body's content
- **Animation**: two layers at prime-factor durations (30s / 38s / 55s hue-rotate), GPU-composited `transform` + `filter` only
- **Do not** add `bg-background` back to `<body>` in `layout.tsx` — it would cover the shimmer
