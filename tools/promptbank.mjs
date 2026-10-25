#!/usr/bin/env node
// Search the prompt bank: ideas for new clips taken from viral videos that creators made with Claude Opus 5.5 (MIT, yihui-dev/awesome-opus5-5-videos).
//   node tools/promptbank.mjs <keywords...> [--cat motion|explainer|3d|interactive] [--tag canvas|svg|threejs|...] [-n 5] [--full]
//   node tools/promptbank.mjs --stats
//   node tools/promptbank.mjs --build <path to a clone of the repo>      (re-creates bank.json; keeps only what the search needs)
// The bank is a menu of IDEAS and prompt wording: every film here is still built on this repo's own engine (VP.*) and page contract.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BANK = join(HERE, "../skills/premium-motion-video/references/prompt-bank/bank.json");
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(k);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };

if (flag("--build")) {
  const src = resolve(opt("--build"));
  const data = JSON.parse(readFileSync(join(src, "data/videos.json"), "utf8"));
  const title = (slug) => { const f = join(src, "prompts", slug + ".md"); if (!existsSync(f)) return slug; return (readFileSync(f, "utf8").match(/^#\s+(.+)$/m) || [, slug])[1].trim(); };
  const out = data.map((v) => ({ slug: v.slug, title: title(v.slug), author: v.author, post: v.post_url, cat: v.category, tags: v.tech_tags, partial: !!v.prompt_partial, prompt: v.prompt }));
  writeFileSync(BANK, JSON.stringify(out));
  console.log(`bank.json: ${out.length} entries, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
  process.exit(0);
}

const bank = JSON.parse(readFileSync(BANK, "utf8"));
if (flag("--stats")) {
  const count = (f) => { const c = {}; bank.forEach((b) => [].concat(f(b)).forEach((k) => (c[k] = (c[k] || 0) + 1))); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join("  "); };
  console.log(bank.length, "prompts\n categories:", count((b) => b.cat), "\n tags:", count((b) => b.tags));
  process.exit(0);
}

const valueOpts = new Set(["--cat", "--tag", "-n"]);
const words = argv.filter((a, i) => !a.startsWith("-") && !valueOpts.has(argv[i - 1])).map((w) => w.toLowerCase());
const cat = opt("--cat"), tag = opt("--tag"), n = +opt("-n", 5), full = flag("--full");
if (!words.length && !cat && !tag) { console.error("usage: node tools/promptbank.mjs <keywords...> [--cat motion|explainer|3d|interactive] [--tag t] [-n 5] [--full] | --stats"); process.exit(1); }

const scored = bank
  .filter((b) => (!cat || b.cat === cat) && (!tag || (b.tags || []).includes(tag)))
  .map((b) => {
    const t = b.title.toLowerCase(), p = b.prompt.toLowerCase();
    const s = words.reduce((a, w) => a + (t.includes(w) ? 5 : 0) + Math.min(5, p.split(w).length - 1), 0);
    return { b, s };
  })
  .filter((x) => !words.length || x.s > 0)
  .sort((a, b) => b.s - a.s || b.b.prompt.length - a.b.prompt.length)
  .slice(0, n);

if (!scored.length) console.log("no match — try other keywords (the bank is in English)");
for (const { b, s } of scored) {
  console.log(`\n■ ${b.title}   [${b.cat}${b.tags?.length ? " · " + b.tags.join(",") : ""}]  score ${s}${b.partial ? "  (prompt chưa đủ)" : ""}`);
  console.log(`  ${b.author} · ${b.post}`);
  console.log("  " + (full ? b.prompt : b.prompt.replace(/\s+/g, " ").slice(0, 320) + (b.prompt.length > 320 ? " …" : "")).replace(/\n/g, "\n  "));
}
