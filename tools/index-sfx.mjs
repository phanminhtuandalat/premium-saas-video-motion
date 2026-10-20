#!/usr/bin/env node
// Build a searchable index of a sound-effect folder: node tools/index-sfx.mjs <dir> [out.json]
// Each entry: {pack, folder, name, file (relative to <dir>), dur_s}. Search it with grep/jq by name or folder.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname, basename, sep } from "node:path";
import { execFileSync } from "node:child_process";
const dir = process.argv[2], out = process.argv[3] || join(dir, "INDEX.json");
if (!dir) { console.error("usage: node tools/index-sfx.mjs <dir> [out.json]"); process.exit(2); }
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(wav|mp3|ogg|flac|m4a|aac)$/i.test(f) && files.push(p); } })(dir);
const items = files.map(p => {
  const rel = relative(dir, p).split(sep), dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).toString().trim());
  return { pack: rel[0], folder: rel.slice(1, -1).join("/"), name: basename(p, extname(p)), file: rel.join("/"), dur_s: +dur.toFixed(2) };
});
writeFileSync(out, JSON.stringify(items, null, 1));
const by = {}; items.forEach(i => by[i.pack] = (by[i.pack] || 0) + 1);
console.log(items.length, "files indexed", by);
