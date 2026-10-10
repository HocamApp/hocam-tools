# hocam-tools

Free YKS micro tools served at `https://www.hocamozelders.com/araclar/*`. A separate Next.js 14 app
(App Router, Tailwind, no runtime deps beyond Next/React) that the main site proxies with one rewrite,
so the tools share the main domain's SEO authority.

Status: Phase 1 on `main` (TYT/AYT net, OBP). Not deployed and not wired to the main site yet.
Agents and contributors: read `AI_AGENT_RULES.md` first (accuracy, privacy, SEO and PR rules; in Turkish like the sibling repos).

## Run

```bash
npm install
npm run dev      # http://localhost:3100/araclar
npm test         # pure-function tests (formulas, URLs, registry)
npm run typecheck && npm run lint && npm run build
```

Everything lives under `basePath: "/araclar"`, so `/` alone is a 404 by design.

## Layout

- `src/lib/net.ts`, `obp.ts`: formulas as pure functions, with tests next to them.
- `src/lib/tools.ts`: tool registry. Add a tool = add an entry + a `src/app/<slug>/page.tsx`; the hub and sitemap pick it up.
- `src/components/ToolPage.tsx`: shared page template (breadcrumb, JSON-LD, FAQ, CTA, related tools).
- Calculators are submit-based with the result region receiving focus; errors are inline and tied to inputs with `aria-describedby`.

## Rules

- No cookies, storage, analytics or network calls from the tools. Input never leaves the browser.
- Links to the main site are absolute and carry `utm_source=araclar&utm_medium=tool&utm_campaign=<slug>`.
- A new tool needs formulas tested against an official source, an `updatedAt` date, and visible explanatory text.
- Brand tokens are copied from `hocam-frontend/src/app/globals.css`; keep them in sync by hand.

## Sources and re-verification

Formulas and test structure were checked on 10 Oct 2026 against ÖSYM's 2026-YKS SSS and the 2026-TYT/AYT
question booklets; links are in the header comments of `src/lib/net.ts` and `src/lib/obp.ts`.
Re-check when the 2027 kılavuz is published and bump `updatedAt` in `src/lib/tools.ts`.

## Phase 2: wiring into `hocam-frontend` (small PR, flag-off by default)

1. `next.config.js`: rewrite `/araclar` and `/araclar/:path*` to the deployed tools origin, only when an env var with that origin is set.
2. `robots.ts`: add `https://www.hocamozelders.com/araclar/sitemap.xml` to `sitemap`.
3. Footer link to `/araclar` (flag-gated); hub linked from SEO pages.
4. Confirm on a preview deploy: proxied pages carry the short `s-maxage` (see `revalidate` in `layout.tsx`), assets load via `/araclar/_next/...`, canonical stays on `www`.
5. Submit the sitemap in Search Console.
