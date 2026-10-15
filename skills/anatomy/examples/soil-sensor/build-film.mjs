// Builds examples/soil-sensor-film/index.html: the soil-sensor figure as a deterministic 9:16 film.
// Reuses the figure's SVG and kit from soil-sensor.html (run `node build.mjs` first).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../../examples/soil-sensor-film");
const src = readFileSync(join(HERE, "soil-sensor.html"), "utf8");

const css = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const svg = src.match(/<svg[\s\S]*?<\/svg>/)[0];
const script = src.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const kit = script.slice(0, script.indexOf("\nconst P = "));
const live = script.slice(script.indexOf("\nconst P = "));
const PROJ = live.match(/const P = (.*);\n/)[1];
const consts = live.match(/const NOZ = .*\n/)[0] + live.match(/const SCALE_Z0 = .*\n/)[0];
const knob = live.match(/const knobPointer = [\s\S]*?\n(?=const EVAP)/)[0];

const page = `<!doctype html>
<html><head><meta charset="utf-8"><title>Tưới nhỏ giọt tự động — 9:16</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;800&display=block" rel="stylesheet">
<script src="../../engine/motion.js"></script>
<style>${css}
html,body{margin:0;background:#0b0b0b}
#stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(120% 70% at 50% 38%,#16181c 0%,#0b0b0b 70%);font-family:"Be Vietnam Pro",sans-serif;color:#fff}
#fig{position:absolute;left:60px;top:560px;width:960px;height:680px;transform-origin:50% 60%;filter:brightness(2.1) contrast(1.25)}
#fig svg{width:100%;height:100%;display:block;overflow:visible}
#kick{position:absolute;left:60px;top:250px;font-size:34px;font-weight:700;letter-spacing:.18em;color:#7fd0ff}
#head{position:absolute;left:60px;top:306px;width:900px;font-size:66px;font-weight:800;line-height:1.12}
#cap{position:absolute;left:60px;width:900px;top:1327px;font-size:54px;font-weight:700;line-height:1.25;text-align:center;text-shadow:0 2px 14px rgba(0,0,0,.7)}
#cap b{color:#B6F36B;font-weight:800}
#gauge{position:absolute;left:60px;width:900px;top:1500px;font-size:34px;font-weight:500;color:#9aa4ad;text-align:center}
</style></head>
<body class="iso" data-theme="dark" style="background:#0b0b0b">
<div id="stage">
 <div id="kick">TƯỚI NHỎ GIỌT TỰ ĐỘNG</div>
 <div id="head">Cảm biến biết<br>lúc nào cây khát</div>
 <div id="fig">${svg}</div>
 <div id="cap"></div>
 <div id="gauge"></div>
</div>

<script type="module">
${kit}
const W = 1080, H = 1920, DUR = 22, FPS = 30;
${consts}
const P = ${PROJ};
${knob}
const svg = document.querySelector("#fig svg");
const q = (n) => svg.querySelector('[data-part="' + n + '"]');
const slider = q("slider"), marker = q("marker"), pointer = q("pointer"), wet = q("wet"), drops = q("drops"), led = q("led");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const NS = "http://www.w3.org/2000/svg";
const dropEls = [];
for (let n = 0; n < NOZ.length * 2; n++) { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", "1.7"); c.setAttribute("fill", "var(--anatomy-blue)"); drops.appendChild(c); dropEls.push(c); }

/* The whole film is a table computed once with a fixed step, so seek(t) is a pure lookup. */
const EVAP = 0.07, FLOW = 0.22, HYST = 0.16, STEP = 1 / 240;
const thAt = (t) => { const s = clamp((t - 13) / 2.4, 0, 1), e = s * s * (3 - 2 * s); return lerp(0.45, 0.62, e); };
const table = [];
{ let m = 0.78, on = false, flow = 0, wetLevel = 0, dropClock = 0;
  for (let i = 0; i <= DUR / STEP; i++) {
    const t = i * STEP, th = thAt(t);
    if (m < th) on = true; else if (m > th + HYST) on = false;
    table.push({ m, th, on, flow, wetLevel, dropClock });
    m = clamp(m + ((on ? FLOW : 0) - EVAP) * STEP, 0.02, 0.98);
    flow += ((on ? 1 : 0) - flow) * (1 - Math.exp(-STEP / 0.12));
    wetLevel += ((m > 0.5 ? 0.15 + (m - 0.5) * 1.2 : 0.12 * m) - wetLevel) * (1 - Math.exp(-STEP / 0.4));
    dropClock += STEP * flow;
  } }
const stateAt = (t) => table[clamp(Math.round(t / STEP), 0, table.length - 1)];

const CAPS = [
  [0.4, "Đầu dò cắm xuống đất, <b>đo độ ẩm</b> liên tục."],
  [4.0, "Đất khô dần, con trượt <b>tụt xuống</b> ngưỡng."],
  [8.0, "Chạm ngưỡng, <b>máy bơm tự bật</b>, nước nhỏ giọt."],
  [12.6, "Muốn đất ẩm hơn? Xoay núm, <b>nâng ngưỡng</b>."],
  [17.6, "Cây đủ nước, <b>anh không cần ra vườn</b>."],
];
const cap = document.getElementById("cap"), gauge = document.getElementById("gauge"), fig = document.getElementById("fig");
const kick = document.getElementById("kick"), head = document.getElementById("head");
let capIdx = -1;

function frame(t) {
  const s = stateAt(t);
  slider.setAttribute("transform", translateAlong(P, [0, 0, SCALE_Z0 + s.m * SCALE_SPAN]));
  marker.setAttribute("transform", translateAlong(P, [0, 0, SCALE_Z0 + s.th * SCALE_SPAN]));
  pointer.setAttribute("d", knobPointer(s.th));
  wet.style.opacity = String(clamp(s.wetLevel, 0, 0.9));
  led.setAttribute("fill", s.on ? "var(--anatomy-lit)" : "var(--anatomy-lo)");
  dropEls.forEach((c, n) => {
    const nozzle = Math.floor(n / 2);
    const phase = (s.dropClock * 1.6 + (n % 2) * 0.5 + nozzle * 0.17) % 1;
    const z = HEADER_Z - 10 - phase * (HEADER_Z - 10 - SOIL_TOP - 1);
    const p = iso([NOZ[nozzle], NOZ_Y, z], P);
    c.setAttribute("cx", p[0].toFixed(1)); c.setAttribute("cy", p[1].toFixed(1));
    c.setAttribute("fill-opacity", String(clamp(s.flow, 0, 1) * (phase < 0.08 ? phase / 0.08 : 1)));
  });
  const k = clamp(t / DUR, 0, 1);
  fig.style.transform = "scale(" + (1.0 + 0.06 * k).toFixed(4) + ")";
  const inT = clamp((t - 0.1) / 0.6, 0, 1), outT = clamp((DUR - t) / 0.5, 0, 1);
  kick.style.opacity = head.style.opacity = String(inT * outT);
  head.style.transform = kick.style.transform = "translateY(" + ((1 - inT) * 24).toFixed(1) + "px)";
  let idx = -1; CAPS.forEach((c, i) => { if (t >= c[0]) idx = i; });
  if (idx !== capIdx) { cap.innerHTML = idx < 0 ? "" : CAPS[idx][1]; capIdx = idx; }
  const ct = idx < 0 ? 0 : t - CAPS[idx][0];
  cap.style.opacity = String(clamp(ct / 0.35, 0, 1) * outT);
  cap.style.transform = "translateY(" + ((1 - clamp(ct / 0.35, 0, 1)) * 18).toFixed(1) + "px)";
  gauge.textContent = "độ ẩm " + Math.round(s.m * 100) + "% · ngưỡng " + Math.round(s.th * 100) + "% · bơm " + (s.on ? "BẬT" : "tắt");
  gauge.style.opacity = String(outT);
}
const B = VP.clock(80);
VP.boot({ seek: frame, dur: DUR, cues: () => [], fonts: ['800 60px "Be Vietnam Pro"', '700 50px "Be Vietnam Pro"', '500 34px "Be Vietnam Pro"'] });
window.SIZE = [W, H]; window.BPM = 80; window.B = B;
window.AUDIT = { beats: [1, 5, 9, 14, 19], safe: [60, 220, 970, 1540], minFont: 26 };
</script></body></html>`;
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), page);
console.log("wrote", join(OUT, "index.html"));
