// Vàng sáng 23/10/2026 trên Remotion: cùng dữ liệu, lời đọc, mốc thời gian và nhạc với examples/gold-3d của dự án (engine VP),
// để so sánh hai cách dựng. Chữ và số lấy từ data.json; mốc từ tl.json + words.json (Whisper).
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import G from "./gold/data.json";
import LINES from "./gold/lines.json";
import TL from "./gold/tl.json";
import WORDS from "./gold/words.json";

type Disp = [string, number][];
const DISP: Disp[] = (LINES as unknown as { disp: Disp }[]).map((l) => l.disp);
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ap = (t: number, a: number, d = 0.5) => ease(clamp((t - a) / d));
const back = (t: number, a: number, d = 0.5) => { const x = clamp((t - a) / d), c = 1.4; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const fmt = (n: number, dec = 0) => n.toLocaleString("vi-VN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const decs = (s: string) => (String(s).split(",")[1] || "").length;
const W_ = WORDS as unknown as Record<string, [string, number, number][]>;
const tok = (i: number, k: number) => {
  const w = W_[TL.lines[i].id] || [], base = TL.lines[i].start;
  let s = 0; for (let q = 0; q < k; q++) s += DISP[i][q][1];
  const e = s + DISP[i][k][1] - 1;
  return { a: base + (w[s] ? w[s][1] : 0), b: base + (w[e] ? w[e][2] : TL.lines[i].dur) };
};
const ta = (i: number, k: number) => tok(i, k).a;
const tb = (i: number, k: number) => tok(i, k).b;
const find = (i: number, text: string, nth = 0) => { let n = 0; for (let k = 0; k < DISP[i].length; k++) if (DISP[i][k][0].replace(/[.,%]+$/, "") === text) { if (n++ === nth) return k; } return 0; };
const lineStart = (i: number) => TL.lines[i].start;
const rise = (t: number, a: number, d = 0.45, dist = 50): React.CSSProperties => { const p = ap(t, a, d); return { opacity: p, transform: `translateY(${((1 - p) * dist).toFixed(1)}px)` }; };

const GOLD = "#E4B94B", RED = "#FF6B6B", GRN = "#3DDC97", MU = "#8A8F9A";
const abs = (css: React.CSSProperties): React.CSSProperties => ({ position: "absolute", ...css });
const K: React.FC<{ top: number; center?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, center, children, style }) => (
  <div style={abs({ left: 60, width: 960, top, fontSize: 30, fontWeight: 800, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", textAlign: center ? "center" : "left", ...style })}>{children}</div>
);
const Big: React.FC<{ top: number; size: number; color?: string; gold?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, size, color, gold, children, style }) => (
  <div style={abs({ left: 0, width: 1080, top, textAlign: "center", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.025em", whiteSpace: "nowrap", fontSize: size, color,
    ...(gold ? { background: "linear-gradient(180deg,#FFE2A0,#D4A53A)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", paddingTop: "0.16em", marginTop: "-0.16em" } : {}), ...style })}>{children}</div>
);
const Card: React.FC<{ css: React.CSSProperties; children?: React.ReactNode }> = ({ css, children }) => (
  <div style={abs({ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 40, boxSizing: "border-box", ...css })}>{children}</div>
);
const Chip: React.FC<{ css: React.CSSProperties; children: React.ReactNode }> = ({ css, children }) => (
  <div style={abs({ padding: "12px 28px", borderRadius: 999, fontSize: 34, fontWeight: 800, whiteSpace: "nowrap", ...css })}>{children}</div>
);
const Bar: React.FC<{ top: number; w: number; bg: string; fg: string; label: string; value: string; op: number }> = ({ top, w, bg, fg, label, value, op }) => (
  <div style={abs({ left: 100, top, width: Math.max(0, w), height: 76, borderRadius: 20, background: bg, color: fg, opacity: op, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", boxSizing: "border-box", fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden" })}>
    <b style={{ fontSize: 30, fontWeight: 700 }}>{label}</b><i style={{ fontStyle: "normal", fontSize: 50 }}>{value}</i>
  </div>
);

/* ---- scenes: each takes t (seconds) ---- */
const S0 = (t: number) => (<>
  <K top={790} center style={rise(t, ta(0, 0), 0.4, 30)}>Báo cáo</K>
  <Big top={850} size={160} gold style={rise(t, ta(0, 0), 0.6, 80)}>Vàng sáng</Big>
  <Big top={1070} size={44} color={MU} style={{ fontWeight: 700, ...rise(t, ta(0, 3), 0.5, 30) }}>{G.date.d}/{G.date.m}/{G.date.y} · {G.date.hh}:{G.date.mm} · radar 7 chiều</Big>
</>);

const S1 = (t: number) => {
  const a1 = ta(1, find(1, G.sjc.buy)), a2 = ta(1, find(1, G.sjc.sell)), p1 = ap(t, a1 - 0.1, 0.8), p2 = ap(t, a2 - 0.1, 0.8);
  return (<>
    <K top={790} style={rise(t, lineStart(1), 0.4, 20)}>SJC · triệu đồng / lượng</K>
    <Card css={{ left: 70, top: 845, width: 940, height: 300, ...rise(t, a1 - 0.5, 0.5, 40) }} />
    <div style={abs({ left: 115, top: 880, width: 380, opacity: ap(t, a1 - 0.4, 0.3) })}>
      <div style={{ fontSize: 28, fontWeight: 700, color: MU, letterSpacing: ".06em" }}>MUA VÀO</div>
      <div style={{ fontSize: 118, fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.1 }}>{fmt(G.sjc.v.buy * p1, decs(G.sjc.buy))}</div></div>
    <div style={abs({ left: 560, top: 880, width: 420, opacity: ap(t, a2 - 0.4, 0.3) })}>
      <div style={{ fontSize: 28, fontWeight: 700, color: MU, letterSpacing: ".06em" }}>BÁN RA</div>
      <div style={{ fontSize: 118, fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.1, color: GOLD }}>{fmt(G.sjc.v.sell * p2, decs(G.sjc.sell))}</div></div>
    <Chip css={{ left: 115, top: 1050, background: "rgba(255,255,255,.1)", color: "#C9CCD3", fontSize: 30, ...rise(t, ta(1, DISP[1].length - 2), 0.4, 20) }}>Giữ nguyên 2 phiên</Chip>
  </>);
};

const S2 = (t: number) => {
  const a = ta(2, find(2, G.xau.price)), p = ap(t, a - 0.1, 1.0), ac = ta(2, find(2, G.xau.chg));
  return (<>
    <K top={790} center style={rise(t, lineStart(2), 0.4, 20)}>Vàng thế giới · USD / ounce</K>
    <Big top={850} size={150} color={RED} style={{ opacity: ap(t, a - 0.3, 0.3) }}>${fmt(G.xau.v * p, decs(G.xau.price))}</Big>
    <Chip css={{ left: 70, top: 1050, color: RED, background: "rgba(255,107,107,.14)", ...rise(t, ac, 0.4, 20) }}>−{G.xau.chg}% phiên 22/10</Chip>
    <Chip css={{ left: 70, top: 1140, color: RED, background: "rgba(255,107,107,.14)", ...rise(t, ac + 0.6, 0.4, 20) }}>−{G.xau.fromPeak}% so với đỉnh 30 phiên</Chip>
    <Chip css={{ left: 70, top: 1230, color: MU, background: "rgba(255,255,255,.08)", ...rise(t, ac + 1.3, 0.4, 20) }}>Thấp nhất khoảng 7 tháng</Chip>
  </>);
};

const S3 = (t: number) => {
  const MAXW = 860, max = G.sjc.v.sell, wOf = (v: number) => (v / max) * MAXW, a = ta(3, 0), p1 = ap(t, a, 0.8), p2 = ap(t, a + 0.5, 0.8), ak = ta(3, find(3, G.premium.pct));
  return (<>
    <K top={790} style={rise(t, lineStart(3), 0.4, 20)}>SJC so với thế giới quy đổi · triệu / lượng</K>
    <Bar top={845} w={wOf(G.sjc.v.sell) * p1} bg="linear-gradient(90deg,#D4A53A,#FFE2A0)" fg="#1A1405" label="SJC bán ra" value={G.sjc.sell} op={ap(t, a, 0.2)} />
    <Bar top={935} w={wOf(G.conv.v) * p2} bg="#3A3F4B" fg="#F4F1EA" label="Thế giới quy đổi" value={G.conv.vn} op={ap(t, a + 0.5, 0.2)} />
    <Big top={1050} size={170} color={RED} style={rise(t, ak - 0.1, 0.55, 60)}>+{G.premium.pct}%</Big>
    <Big top={1240} size={38} color={MU} style={{ fontWeight: 700, ...rise(t, ta(4, 0), 0.45, 24) }}>SJC cao hơn {G.premium.tr} triệu một lượng</Big>
  </>);
};

const S4 = (t: number) => {
  const card = (x: number, lbl: string, val: string, sub: string, color: string | undefined, st: React.CSSProperties) => (
    <Card css={{ left: x, top: 850, width: 290, height: 300, padding: "34px 24px", textAlign: "center", ...st }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: MU, letterSpacing: ".06em" }}>{lbl}</div>
      <div style={{ fontSize: 78, fontWeight: 900, letterSpacing: "-.03em", lineHeight: 1.1, marginTop: 34, color }}>{val}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: MU, marginTop: 12 }}>{sub}</div>
    </Card>);
  return (<>
    <K top={790} style={rise(t, lineStart(5), 0.4, 20)}>Vĩ mô</K>
    {card(70, "FED", "+" + G.macro.fed, "điểm cơ bản · " + G.macro.vote, RED, rise(t, ta(5, 0), 0.5, 50))}
    {card(395, "LỢI SUẤT MỸ 10 NĂM", G.macro.us10y + "%", "US10Y", undefined, rise(t, ta(6, find(6, G.macro.us10y)) - 0.7, 0.5, 50))}
    {card(720, "CHỈ SỐ ĐÔ LA", G.macro.dxy, "DXY", undefined, rise(t, ta(6, find(6, G.macro.dxy)) - 0.7, 0.5, 50))}
    <Chip css={{ left: 70, top: 1195, color: MU, background: "rgba(255,255,255,.08)", fontSize: 30, ...rise(t, ta(6, DISP[6].length - 1) + 0.3, 0.4, 20) }}>Lực cản ngắn hạn cho vàng</Chip>
  </>);
};

const S5 = (t: number) => {
  const MAXW = 860, max = G.trend.peakV, wOf = (v: number) => (v / max) * MAXW, a = ta(7, find(7, G.trend.peak)), p1 = ap(t, a - 0.1, 0.8), p2 = ap(t, a + 0.5, 0.8);
  return (<>
    <K top={790} style={rise(t, lineStart(7), 0.4, 20)}>Trong nước · SJC bán ra · triệu / lượng</K>
    <Bar top={845} w={wOf(G.trend.peakV) * p1} bg="#3A3F4B" fg="#F4F1EA" label="Đỉnh lịch sử" value={G.trend.peak} op={ap(t, a - 0.1, 0.2)} />
    <Bar top={935} w={wOf(G.sjc.v.sell) * p2} bg="linear-gradient(90deg,#D4A53A,#FFE2A0)" fg="#1A1405" label="Nay" value={G.sjc.sell} op={ap(t, a + 0.5, 0.2)} />
    <Big top={1050} size={170} color={RED} style={rise(t, ta(7, find(7, G.trend.fromPeak)) - 0.1, 0.55, 60)}>−{G.trend.fromPeak}%</Big>
    <Chip css={{ left: 70, top: 1240, color: RED, background: "rgba(255,107,107,.14)", fontSize: 32, ...rise(t, ta(7, 0) + 0.5, 0.45, 20) }}>Giảm {G.trend.days} phiên liên tiếp · −{G.trend.drop} triệu từ đầu tuần</Chip>
  </>);
};

const S6 = (t: number) => {
  const L = G.levels;
  const rows: [string, string, string, number][] = [
    [L.xauRes[0], "kháng cự", RED, ta(8, find(8, L.xauRes[0]))],
    [L.xauRes[1], "kháng cự", RED, ta(8, find(8, L.xauRes[1]))],
    [G.xau.price, "hiện tại", GOLD, ta(8, 0)],
    [L.xauSup[0], "hỗ trợ", GRN, ta(8, find(8, L.xauSup[0]))],
    [L.xauSup[1], "hỗ trợ", GRN, ta(8, find(8, L.xauSup[1]))],
  ];
  return (<>
    <K top={790} style={rise(t, lineStart(8), 0.4, 20)}>Thế giới (USD) · SJC (triệu)</K>
    {rows.map(([v, role, c, a], j) => { const p = back(t, a - 0.15, 0.5); return (
      <div key={j} style={abs({ left: 70, top: 845 + j * 84, width: 460, height: 76, display: "flex", alignItems: "baseline", gap: 18, borderRadius: 20, padding: "6px 24px", boxSizing: "border-box", background: `rgba(255,255,255,${j === 2 ? ".12" : ".06"})`, opacity: ap(t, a - 0.15, 0.3), transform: `translateX(${((1 - p) * -40).toFixed(1)}px)` })}>
        <span style={{ fontSize: j === 2 ? 50 : 46, fontWeight: 900, color: c }}>{v}</span><span style={{ fontSize: 26, fontWeight: 700, color: MU }}>{role}</span></div>); })}
    <Card css={{ left: 565, top: 845, width: 445, height: 200, padding: "28px 30px", ...rise(t, ta(9, find(9, L.sjcBuyLo)) - 0.4, 0.5, 40) }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: MU, letterSpacing: ".06em" }}>SJC · VÙNG MUA TỐT</div>
      <div style={{ fontSize: 72, fontWeight: 900, marginTop: 22, color: GRN }}>{L.sjcBuyLo} – {L.sjcBuyHi}</div></Card>
    <Card css={{ left: 565, top: 1065, width: 445, height: 200, padding: "28px 30px", ...rise(t, ta(9, find(9, L.sjcBuyLo)) + 0.9, 0.5, 40) }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: MU, letterSpacing: ".06em" }}>SJC · VÙNG BÁN</div>
      <div style={{ fontSize: 72, fontWeight: 900, marginTop: 22, color: RED, whiteSpace: "nowrap" }}>{L.sjcSellLo} – {L.sjcSellHi}</div></Card>
  </>);
};

const S7 = (t: number) => {
  const bl: [number, string][] = [
    [11, `Premium ${G.premium.pct}% · SJC chưa theo thế giới`],
    [12, `Fed diều hâu · đô la, lợi suất còn cao`],
    [13, `Giải ngân khi SJC ${G.levels.sjcBuyLo}–${G.levels.sjcBuyHi} và premium < ${G.premium.ceil}%`],
    [14, `Cảnh báo: thủng ${G.levels.xauSup[1]} → trung hạn xấu`],
  ];
  return (<>
    <K top={735} center style={rise(t, ta(10, 0) - 0.1, 0.4, 20)}>Theo báo cáo</K>
    <Big top={775} size={150} gold style={rise(t, ta(10, 2), 0.6, 80)}>{G.rec.verdict}</Big>
    <Big top={935} size={52} style={{ fontWeight: 800, ...rise(t, ta(10, 3), 0.5, 30) }}>{G.rec.sub}</Big>
    {bl.map(([li, txt], j) => (
      <div key={j} style={abs({ left: 70, top: 1030 + j * 62, width: 940, fontSize: 34, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", ...rise(t, ta(li, 0), 0.4, 18) })}><span style={{ color: GOLD }}>▸</span> {txt}</div>))}
  </>);
};

const SCENES = [S0, S1, S2, S3, S4, S5, S6, S7];
const SCENE_COLOR = ["#E4B94B", "#E4B94B", "#FF4D4D", "#FF4D4D", "#E4B94B", "#FF4D4D", "#E4B94B", "#E4B94B"];
const SCENE_LIGHT = ["#FFE2A0", "#FFE2A0", "#FF9A7A", "#FF9A7A", "#FFE2A0", "#FF9A7A", "#FFE2A0", "#FFE2A0"];

/* ---- 3D backdrop: faceted torus knot + seeded particle field, camera orbit (same idea as VP3 'orbit') ---- */
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const Knot: React.FC<{ color: string; light: string; k: number; dir: number }> = ({ color, light, k, dir }) => {
  const pos = React.useMemo(() => { const R = rng(7), a = new Float32Array(420 * 3); for (let i = 0; i < 420; i++) { const r = 3 + R() * 6, ang = R() * 6.2832, e = (R() - 0.5) * 5; a[i * 3] = Math.cos(ang) * r; a[i * 3 + 1] = e; a[i * 3 + 2] = Math.sin(ang) * r; } return a; }, []);
  const s = ease(clamp(k / 6)), orbit = (k * 0.12 + 0.4) * 0.35 * Math.PI * dir;
  const pop = 0.55 + 0.45 * (1 - Math.exp(-k * 2.2) * Math.cos(k * 4.5));
  return (
    <group rotation={[0, -orbit, 0]} scale={(11 + (7.6 - 11) * s) / 7.6}>
      <mesh rotation={[k * 0.21, k * 0.33, 0]} position={[0, -0.35, 0]} scale={pop}>
        <torusKnotGeometry args={[1, 0.34, 220, 24, 2, 3]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.22} flatShading />
      </mesh>
      <points rotation={[0, k * 0.05, 0]}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
        <pointsMaterial color={light} size={0.035} transparent opacity={0.8} depthWrite={false} />
      </points>
      <pointLight color={light} intensity={60} position={[3, 2.5, 4]} decay={2} />
      <pointLight color={color} intensity={40} position={[-4, -1.5, -2]} decay={2} />
      <ambientLight intensity={0.35} />
    </group>
  );
};

/* ---- captions ---- */
const PAGES: { w: string; a: number; b: number }[][] = [];
DISP.forEach((d, i) => {
  let cur: { w: string; a: number; b: number }[] = []; const flush = () => { if (cur.length) { PAGES.push(cur); cur = []; } };
  d.forEach(([w], k) => { cur.push({ w, a: ta(i, k), b: tb(i, k) }); if (cur.length >= 5 || /[,.?!:;]$/.test(w)) flush(); });
  flush();
});

export const GOLD_DURATION = Math.ceil(TL.dur * 30);

export const Gold: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  let cur = 0;
  TL.scenes.forEach((s, i) => { if (T >= s.a - 0.001) cur = i; });
  const sc = TL.scenes[cur], inA = clamp((T - sc.a) / 0.3), outA = cur === SCENES.length - 1 ? 1 : clamp((sc.b + 0.1 - T) / 0.3);
  const o = ease(inA) * ease(outA), k = Math.max(0, T - sc.a) / 0.6;

  let pi = -1; PAGES.forEach((p, i) => { if (T >= p[0].a - 0.05) pi = i; });
  const last = pi >= 0 ? PAGES[pi][PAGES[pi].length - 1].b : 0;
  const showing = pi >= 0 && T < last + 0.5 ? pi : -1;

  return (
    <AbsoluteFill style={{ background: "#05060A", color: "#F4F1EA", fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif' }}>
      <Audio src={staticFile("gold-mix.wav")} />
      <div style={abs({ left: 60, top: -80, width: 960, height: 960, opacity: o, WebkitMaskImage: "linear-gradient(#000 72%,transparent 100%)" })}>
        <ThreeCanvas width={960} height={960} camera={{ position: [0, 0.6, 7.6], fov: 38 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
          <Knot color={SCENE_COLOR[cur]} light={SCENE_LIGHT[cur]} k={k} dir={cur === 2 || cur === 3 || cur === 5 ? -1 : 1} />
        </ThreeCanvas>
      </div>
      <div style={{ ...abs({ left: 60, top: 226, fontSize: 28, fontWeight: 800, letterSpacing: ".2em", color: GOLD }), textShadow: "0 0 10px #05060A,0 0 4px #05060A" }}>VÀNG SÁNG · {G.date.d}/{G.date.m}/{G.date.y}</div>
      <div style={{ ...abs({ left: 60, top: 268, width: 960, fontSize: 26, fontWeight: 500, color: MU }), textShadow: "0 0 10px #05060A,0 0 4px #05060A" }}>{G.disclaimer}</div>
      <div style={abs({ inset: 0, opacity: o })}>{SCENES[cur](T)}</div>
      <div style={abs({ left: 60, width: 960, top: 1327, fontSize: 54, fontWeight: 800, lineHeight: 1.25, textAlign: "center" })}>
        {showing >= 0 && PAGES[showing].map((x, i) => (<React.Fragment key={i}><span style={{ color: T >= x.b ? "#F4F1EA" : T >= x.a ? "#FFD98A" : "#5A5F6B" }}>{x.w}</span>{" "}</React.Fragment>))}
      </div>
    </AbsoluteFill>
  );
};
