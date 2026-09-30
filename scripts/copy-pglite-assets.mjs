#!/usr/bin/env node
/**
 * Nitro bundles `@electric-sql/pglite` into the server function, but the
 * package loads `pglite.data` / wasm via `new URL("./…", import.meta.url)`.
 * Those sidecars are not emitted next to the chunk, so `vite preview` (no
 * DATABASE_URL, PGLite fallback) crashes on boot. Copy them beside the chunk.
 * Deployed apps with DATABASE_URL never open these files.
 */
import { access, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, ".vercel/output/functions/__server.func/_libs");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
const bundled = join(destDir, "electric-sql__pglite.mjs");
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

try {
  await access(bundled);
} catch {
  console.log("[pglite] bundled module not in this build — skipping asset copy");
  process.exit(0);
}

for (const file of files) {
  await copyFile(join(srcDir, file), join(destDir, file));
}
console.log("[pglite] copied wasm/data next to the server bundle");
