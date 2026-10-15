import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 640, HEIGHT = 440;

const PLATE = { x: -134, y: -74, w: 276, d: 148, r: 8 };
const PLATE_H = 12, FOOT_H = 5;
const TROUGH = { x: -122, y: -38, w: 104, d: 76, r: 4 };
const TROUGH_H = 26, SOIL_TOP = 19;
const NOZ = [-98, -70, -42], NOZ_Y = -16, HEADER_Z = 66;
const PUMP = { x: 2, y: -32, w: 26, d: 26, r: 3 }, PUMP_H = 16;
const RISER = [15, -19];
const TANK = [64, -19], TANK_R = 21, TANK_H = 54;
const CTRL = { x: 4, y: 14, w: 44, d: 30, r: 3 }, CTRL_H = 22;
const SCALE_X = 78, SCALE_Y = 30, SCALE_Z0 = 6, SCALE_SPAN = 70;
const PROBE = [-66, 14];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [TANK[0], TANK[1], TANK_H + 4], [NOZ[0], NOZ_Y, HEADER_Z + 8], [SCALE_X, SCALE_Y, SCALE_Z0 + SCALE_SPAN + 8]],
  WIDTH, HEIGHT, { pad: 30, azimuth: 42 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -118, y: PLATE.y + PLATE.d - 15, w: 200, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

function tank() {
  const [x, y] = TANK;
  const out = [];
  out.push(S(k.cylinder(x, y, TANK_R + 2, 0, 4, P, 48, 0.6), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, TANK_R, 4, TANK_H - 4, P, 48, 0.8), { tone: "mid", crease: "lo" }));
  for (const z of [16, 30, 44]) out.push(L(k.sideArc(x, y, TANK_R, z, P, 40), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, TANK_R - 2, TANK_H, 3, P, 48, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 5, TANK_H + 3, 3, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 5, TANK_H + 3, TANK_H + 6, 20, P), { tone: "lo" }));
  out.push(L(k.ring(x, y, TANK_R - 4, TANK_H + 3, P, 48), { tone: "lo" }));
  return out.join("");
}

function pump() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PUMP, 0, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf({ x: PUMP.x - 3, y: PUMP.y - 3, w: PUMP.w + 6, d: PUMP.d + 6, r: 2 }, 0, 3, P, 4, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(PUMP, 3, PUMP_H - 3, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PUMP, 3), PUMP_H, P), { tone: "faint" }));
  out.push(D(k.corners(PUMP, 5).map(([x, y]) => at([x, y, PUMP_H])), { size: 0.45 }));
  out.push(S(k.slabOf({ x: PUMP.x + PUMP.w, y: RISER[1] - 2.5, w: TANK[0] - TANK_R - PUMP.x - PUMP.w + 2, d: 5, r: 1 }, 7, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(RISER[0], RISER[1], 3, PUMP_H, HEADER_Z - PUMP_H, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([30, 44].map((z) => k.sideArc(RISER[0], RISER[1], 3, z, P, 12)).join(""), { tone: "faint" }));
  return out.join("");
}

function header() {
  const out = [];
  const fromX = NOZ[0] - 12;
  out.push(S(k.slabOf({ x: fromX, y: NOZ_Y - 2.5, w: RISER[0] + 4 - fromX, d: 5, r: 1 }, HEADER_Z, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(fromX - 4, NOZ_Y, 3, 0, HEADER_Z + 5, P, 20), { tone: "mid", crease: "none" }));
  for (const x of NOZ) {
    out.push(S(k.cylinder(x, NOZ_Y, 2.4, HEADER_Z - 5, 5, P, 16), { tone: "mid" }));
    out.push(S(k.cylinder(x, NOZ_Y, 1.4, HEADER_Z - 8, 3, P, 14), { tone: "hi" }));
  }
  out.push(D(NOZ.map((x) => at([x, NOZ_Y, HEADER_Z + 5])), { size: 0.45 }));
  return out.join("");
}

function trough() {
  const out = [`<path class="iso-halo" d="${k.haloOf(TROUGH, 0, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(TROUGH, 0, TROUGH_H, P, 6, 0.8), { tone: "mid" }));
  const soil = k.insetPlan(TROUGH, 4);
  out.push(S(k.slabOf(soil, SOIL_TOP - 0.1, 0.1, P, 6), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(TROUGH, 2), TROUGH_H, P), { tone: "faint" }));
  const soilLines = [-26, -4, 18].map((yy) => k.lineOnTop([soil.x + 4, yy], [soil.x + soil.w - 4, yy], SOIL_TOP, P)).join("");
  out.push(L(soilLines, { tone: "faint" }));
  out.push(D(k.corners(TROUGH, 5).map(([x, y]) => at([x, y, TROUGH_H])), { size: 0.45 }));
  return out.join("");
}

function seedlings() {
  const out = [];
  for (const x of NOZ) {
    out.push(S(k.cylinder(x, NOZ_Y + 14, 0.9, SOIL_TOP, 12, P, 10), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: x - 7, y: NOZ_Y + 12.4, w: 7, d: 3.2, r: 1.4 }, SOIL_TOP + 8, 0.8, P, 5), { tone: "hi", crease: "none" }));
    out.push(S(k.slabOf({ x, y: NOZ_Y + 12.4, w: 7, d: 3.2, r: 1.4 }, SOIL_TOP + 11, 0.8, P, 5), { tone: "hi", crease: "none" }));
  }
  return out.join("");
}

function probe() {
  const [x, y] = PROBE;
  const out = [];
  for (const dx of [-3.4, 3.4]) {
    out.push(S(k.cylinder(x + dx, y, 1.5, SOIL_TOP - 14, 14 + 24, P, 14), { tone: "hi", crease: "none" }));
  }
  out.push(S(k.slabOf({ x: x - 8, y: y - 5, w: 16, d: 10, r: 2 }, SOIL_TOP + 22, 9, P, 4, 0.6), { tone: "mid" }));
  out.push(D([at([x - 4, y, SOIL_TOP + 31]), at([x + 4, y, SOIL_TOP + 31])], { size: 0.45 }));
  return out.join("");
}

function controller() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CTRL, 0, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(CTRL, 0, CTRL_H, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(CTRL, 3), CTRL_H, P), { tone: "faint" }));
  out.push(D(k.corners(CTRL, 5).map(([x, y]) => at([x, y, CTRL_H])), { size: 0.45 }));
  const knob = [CTRL.x + 12, CTRL.y + 15];
  out.push(S(k.cylinder(knob[0], knob[1], 6.5, CTRL_H, 4, P, 32), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 6.5, CTRL_H, CTRL_H + 4, 36, P), { tone: "lo" }));
  out.push(S(k.cylinder(CTRL.x + 34, CTRL.y + 15, 2.6, CTRL_H, 1.6, P, 20), { tone: "lo" }));
  return out.join("");
}

const knobPointer = (th) => {
  const kx = CTRL.x + 12, ky = CTRL.y + 15;
  const a = Math.PI * 0.75 + th * Math.PI * 1.5 + Math.PI / 2;
  return k.lineOnTop([kx, ky], [kx + Math.cos(a) * 6.4, ky + Math.sin(a) * 6.4], CTRL_H + 4, P);
};

function scale() {
  const out = [];
  const x = SCALE_X, y = SCALE_Y;
  out.push(S(k.slabOf({ x: x - 12, y: y - 8, w: 24, d: 16, r: 2 }, 0, 4, P, 4, 0.6), { tone: "lo" }));
  for (const dx of [-5, 5]) out.push(S(k.cylinder(x + dx, y, 1.5, 4, SCALE_SPAN + 6, P, 14), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: x - 8, y: y - 5, w: 16, d: 10, r: 2 }, SCALE_Z0 + SCALE_SPAN + 4, 4, P, 4, 0.5), { tone: "mid" }));
  return out.join("");
}

function scaleTicks() {
  const x = SCALE_X, y = SCALE_Y;
  let minor = "", major = "";
  for (let i = 0; i <= 20; i++) {
    const z = SCALE_Z0 + (i / 20) * SCALE_SPAN, len = i % 5 === 0 ? 5 : 2.6;
    const a = at([x + 8, y + 5.5, z]), b = at([x + 8 + len, y + 5.5, z]);
    const d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    if (i % 5 === 0) major += d; else minor += d;
  }
  return L(minor, { tone: "lo" }) + L(major, { tone: "mid" });
}

const sliderAt = (m) => k.translateAlong(P, [0, 0, SCALE_Z0 + m * SCALE_SPAN]);
const SLIDER_PLAN = { x: SCALE_X - 8, y: SCALE_Y - 4.5, w: 16, d: 9, r: 1.5 };
const sliderSvg = () => S(k.slabOf(SLIDER_PLAN, 0, 5, P, 4, 0.5), { tone: "hi", lit: true }) + L(k.planOutline(k.insetPlan(SLIDER_PLAN, 2), 5, P), { tone: "faint" });
const markerSvg = () => S(k.slabOf({ x: SCALE_X + 6, y: SCALE_Y + 5, w: 10, d: 3, r: 0.6 }, -1, 2.4, P, 3), { tone: "mid", crease: "none" });
const markerAt = (th) => k.translateAlong(P, [0, 0, SCALE_Z0 + th * SCALE_SPAN]);

const wires = () => [
  k.wireSvg(at([PROBE[0], PROBE[1], SOIL_TOP + 31]), at([CTRL.x + 6, CTRL.y + 6, CTRL_H]), { tone: "mid", via: [at([PROBE[0] + 8, PROBE[1], SOIL_TOP + 38]), at([CTRL.x - 6, CTRL.y + 6, CTRL_H + 14])] }),
  k.wireSvg(at([CTRL.x + 38, CTRL.y + 5, CTRL_H]), at([SCALE_X - 4, SCALE_Y - 2, SCALE_Z0 + 2]), { tone: "lo", dotted: true }),
  k.wireSvg(at([CTRL.x + 34, CTRL.y + 15, CTRL_H + 1.6]), at([PUMP.x + PUMP.w - 4, PUMP.y + 8, PUMP_H]), { tone: "lo", dotted: true }),
].join("");

const ledAt = at([CTRL.x + 34, CTRL.y + 15, CTRL_H + 1.8]);
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Tưới nhỏ giọt tự động. Một đầu dò cắm vào đất đo độ ẩm. Khi độ ẩm tụt dưới ngưỡng đặt bằng núm xoay, máy bơm bật, nước từ bể chảy qua ống và nhỏ giọt xuống luống. Con trượt trên thang đo đi lên theo độ ẩm, và máy bơm tắt khi độ ẩm vượt ngưỡng.",
  body: [
    plate(),
    tank(),
    pump(),
    scale(),
    scaleTicks(),
    `<g data-part="marker" transform="${markerAt(0.4)}">${markerSvg()}</g>`,
    `<g data-part="slider" transform="${sliderAt(0.3)}">${sliderSvg()}</g>`,
    trough(),
    seedlings(),
    controller(),
    `<path data-part="pointer" class="iso-line" data-tone="lit" data-free="start" d="${knobPointer(0.4)}" style="stroke-width:1.1"/>`,
    probe(),
    header(),
    wires(),
    `<g data-part="wet" style="opacity:0">${NOZ.map((x) => L(k.ring(x, NOZ_Y, 9, SOIL_TOP, P, 28), { tone: "lit" })).join("")}</g>`,
    `<g data-part="drops"></g>`,
    `<circle data-part="led" cx="${ledAt[0].toFixed(1)}" cy="${ledAt[1].toFixed(1)}" r="1.6" fill="var(--anatomy-lo)"/>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const NOZ = ${JSON.stringify(NOZ)}, NOZ_Y = ${NOZ_Y}, HEADER_Z = ${HEADER_Z}, SOIL_TOP = ${SOIL_TOP};
const SCALE_Z0 = ${SCALE_Z0}, SCALE_SPAN = ${SCALE_SPAN}, CTRL = ${JSON.stringify(CTRL)}, CTRL_H = ${CTRL_H};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (n) => svg.querySelector('[data-part="' + n + '"]');
const slider = q("slider"), marker = q("marker"), pointer = q("pointer"), wet = q("wet"), drops = q("drops"), led = q("led");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const knobPointer = ${knobPointer.toString().replace(/k\.lineOnTop/g, "lineOnTop")};
const EVAP = 0.035, FLOW = 0.2, HYST = 0.14;
const NS = "http://www.w3.org/2000/svg";
const dropEls = [];
for (let n = 0; n < NOZ.length * 2; n++) { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", "1.7"); c.setAttribute("fill", "var(--anatomy-blue)"); drops.appendChild(c); dropEls.push(c); }
let m = 0.62, th = 0.4, on = false, last = 0, frame = 0, visible = false, idle = 0, dropClock = 0, wetLevel = 0, flow = 0;
function draw() {
  slider.setAttribute("transform", translateAlong(P, [0, 0, SCALE_Z0 + m * SCALE_SPAN]));
  marker.setAttribute("transform", translateAlong(P, [0, 0, SCALE_Z0 + th * SCALE_SPAN]));
  pointer.setAttribute("d", knobPointer(th));
  wet.style.opacity = String(clamp(wetLevel, 0, 0.9));
  led.setAttribute("fill", on ? "var(--anatomy-lit)" : "var(--anatomy-lo)");
  dropEls.forEach((c, n) => {
    const nozzle = Math.floor(n / 2);
    const phase = (dropClock * 1.6 + (n % 2) * 0.5 + nozzle * 0.17) % 1;
    const z = HEADER_Z - 10 - phase * (HEADER_Z - 10 - SOIL_TOP - 1);
    const p = iso([NOZ[nozzle], NOZ_Y, z], P);
    c.setAttribute("cx", p[0].toFixed(1)); c.setAttribute("cy", p[1].toFixed(1));
    c.setAttribute("fill-opacity", String(clamp(flow, 0, 1) * (phase < 0.08 ? phase / 0.08 : 1)));
  });
  const text = "độ ẩm " + Math.round(m * 100) + "% · ngưỡng " + Math.round(th * 100) + "% · bơm " + (on ? "BẬT" : "tắt");
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(th * 100)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (!still.matches) {
    if (m < th) on = true; else if (m > th + HYST) on = false;
    m = clamp(m + ((on ? FLOW : 0) - EVAP) * dt, 0.02, 0.98);
    flow += ((on ? 1 : 0) - flow) * (1 - Math.exp(-dt / 0.12));
    wetLevel += ((m > 0.5 ? 0.15 + (m - 0.5) * 1.2 : 0.12 * m) - wetLevel) * (1 - Math.exp(-dt / 0.4));
    dropClock += dt * flow;
  } else { on = m < th; flow = on ? 1 : 0; }
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const setTh = (v) => { th = clamp(v, 0.2, 0.75); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (e) => { const b = svg.getBoundingClientRect(); setTh(0.2 + clamp(((e.clientX - b.left) / b.width - 0.2) / 0.6, 0, 1) * 0.55); });
stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setTh(th + 0.05); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setTh(th - 0.05); }
});
draw();
`;

const body = k.plateHtml({
  fig: "Hình 1",
  title: "Tưới nhỏ giọt tự động",
  hint: "Rê chuột để chỉnh ngưỡng độ ẩm",
  readout: "độ ẩm 62% · ngưỡng 40% · bơm tắt",
  keys: [
    { mark: "lit", label: "Con trượt: độ ẩm đất đang đo" },
    { mark: "raised", label: "Vạch ngưỡng: dưới mức này thì bơm bật" },
  ],
  caption: "Đầu dò đo độ ẩm đất. Khi con trượt tụt xuống dưới vạch ngưỡng, máy bơm bật và nước nhỏ giọt xuống luống cho đến khi độ ẩm lên lại. Chỉnh núm xoay để đổi ngưỡng.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Ngưỡng độ ẩm: phím mũi tên đổi ngưỡng" aria-valuemin="20" aria-valuemax="75" aria-valuenow="40">${svg}</div>`,
});
const out = theme === "light" ? "soil-sensor-light.html" : "soil-sensor.html";
writeFileSync(join(HERE, out), k.pageHtml({ title: "Tưới nhỏ giọt tự động", theme, body, script: kitScript() + live }));
console.log("wrote", out);
