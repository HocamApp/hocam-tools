/*
 * Cloudflare build step: turns the `next build` export (out/) into the folder
 * Workers serves as static assets (dist/).
 *
 *   out/  ->  dist/araclar/   (the app lives under basePath /araclar)
 *
 * _redirects and _headers are generated from next.config.js (redirects() and
 * headers()), because Next ignores both for an export. One source of truth:
 * edit the rules in next.config.js, not here.
 *
 * Run after `next build` with WORKERS_CI_BRANCH set (Cloudflare sets it).
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const config = require(resolve(root, "next.config.js"));

const out = resolve(root, "out");
const dist = resolve(root, "dist");
const base = config.basePath ?? "";

if (!existsSync(resolve(out, "index.html"))) {
  console.error("out/index.html not found. Run `next build` with WORKERS_CI_BRANCH set first (output: export).");
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(resolve(dist, base.replace(/^\//, "")), { recursive: true });
cpSync(out, resolve(dist, base.replace(/^\//, "")), { recursive: true });

// "404-page" handling serves the nearest 404.html up the tree.
cpSync(resolve(out, "404.html"), resolve(dist, "404.html"));

// Redirects: Next adds basePath to source and destination itself; _redirects does not.
const redirects = await config.redirects();
const redirectLines = redirects.map((r) => {
  if (r.source.includes(":") || r.source.includes("*") || r.destination.includes(":")) {
    throw new Error(`Redirect ${r.source} uses a pattern; check the _redirects syntax before allowing it.`);
  }
  // Next maps "/" to the bare basePath; a trailing slash would cost an extra hop.
  const destination = r.destination === "/" ? base || "/" : `${base}${r.destination}`;
  return `${base}${r.source} ${destination} ${r.permanent ? 308 : 307}`;
});
writeFileSync(resolve(dist, "_redirects"), `${redirectLines.join("\n")}\n`);

// Headers: next.config.js uses "/:path*"; _headers spells that "/*".
const headerRules = await config.headers();
const headerBlocks = headerRules.map((rule) => {
  const source = rule.source === "/:path*" ? "/*" : `${base}${rule.source}`;
  if (source !== "/*" && /[:*]/.test(rule.source)) {
    throw new Error(`Header rule ${rule.source} uses a pattern; check the _headers syntax before allowing it.`);
  }
  return `${source}\n${rule.headers.map((h) => `  ${h.key}: ${h.value}`).join("\n")}`;
});
writeFileSync(resolve(dist, "_headers"), `${headerBlocks.join("\n\n")}\n`);

console.log(`dist/ ready: ${redirectLines.length} redirects, ${headerRules.length} header rule(s).`);
