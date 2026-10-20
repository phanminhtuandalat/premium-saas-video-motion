#!/usr/bin/env node
// Download a link-shared Google Drive folder (recursive) without any login or extra software.
// usage: node tools/fetch-drive-folder.mjs <folderId> <out_dir>   (skips files already downloaded)
import { mkdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const [rootId, outDir] = process.argv.slice(2);
if (!rootId || !outDir) { console.error("usage: node tools/fetch-drive-folder.mjs <folderId> <out_dir>"); process.exit(2); }
const dec = s => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const safe = s => dec(s).replace(/[<>:"/\|?*\x00-\x1f]/g, "_").trim();
const AUDIO = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
let ok = 0, skip = 0, bad = [];

async function list(id) {
  const html = (await (await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`)).text()).replace(/\n/g, " ");
  return [...html.matchAll(/id="entry-([^"]+)".*?flip-entry-title">([^<]*)/g)].map(m => ({ id: m[1], name: safe(m[2]) }));
}
async function walk(id, dir) {
  mkdirSync(dir, { recursive: true });
  for (const e of await list(id)) {
    if (AUDIO.test(e.name)) {
      const dst = join(dir, e.name);
      if (existsSync(dst) && statSync(dst).size > 0) { skip++; continue; }
      const r = await fetch(`https://drive.usercontent.google.com/download?id=${e.id}&export=download&confirm=t`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (!r.ok || (r.headers.get("content-type") || "").includes("text/html")) { bad.push(join(dir, e.name)); continue; }
      writeFileSync(dst, buf); ok++;
    } else if (!/\.[A-Za-z0-9]{2,4}$/.test(e.name)) await walk(e.id, join(dir, e.name));   // no extension = subfolder
    else bad.push(join(dir, e.name) + " (not audio, skipped)");
  }
}
await walk(rootId, outDir);
console.log(`downloaded ${ok}, already there ${skip}, problems ${bad.length}`); bad.forEach(b => console.log("  -", b));
