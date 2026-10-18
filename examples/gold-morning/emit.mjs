#!/usr/bin/env node
// data.json / lines.json -> data.js / lines.js (loaded by index.html with plain <script src>)
import { readFileSync, writeFileSync } from "node:fs";
writeFileSync("data.js", "window.GOLD=" + readFileSync("data.json", "utf8") + ";\n");
writeFileSync("lines.js", "window.LINES=" + readFileSync("lines.json", "utf8") + ";\n");
console.log("data.js, lines.js written");
