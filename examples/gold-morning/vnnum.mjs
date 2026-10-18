// Vietnamese number reader for narration. "143,6" -> "một trăm bốn mươi ba phẩy sáu"; "4.166,1" -> "bốn nghìn một trăm sáu mươi sáu phẩy một".
// Input uses the report's own convention: "." groups thousands, "," is the decimal mark.
const D = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const SCALE = ["", "nghìn", "triệu", "tỷ"];

function group(n, lead) {            // 0..999 -> words; lead = this is the leading group (no "không trăm")
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10, out = [];
  if (h > 0 || !lead) out.push(D[h], "trăm");
  if (t === 0 && u > 0 && (h > 0 || !lead)) out.push("lẻ");
  if (t === 1) out.push("mười");
  else if (t > 1) out.push(D[t], "mươi");
  if (u > 0) {
    if (t >= 2 && u === 1) out.push("mốt");
    else if (t >= 1 && u === 5) out.push("lăm");
    else out.push(D[u]);
  }
  return out;
}

export function readInt(n) {
  n = Math.abs(Math.trunc(n));
  if (n === 0) return D[0];
  const parts = []; let k = 0;
  while (n > 0) { parts.unshift([n % 1000, k]); n = Math.floor(n / 1000); k++; }
  const words = [];
  parts.forEach(([g, s], i) => {
    if (g === 0) return;
    words.push(...group(g, i === 0), SCALE[s]);
  });
  return words.filter(Boolean).join(" ");
}

export function readNumber(str) {
  const s = String(str).trim().replace(/[^\d.,]/g, "");
  const [intPart, dec] = s.split(",");
  const ip = parseInt(intPart.replace(/\./g, ""), 10);
  let out = readInt(ip);
  if (dec && !/^0+$/.test(dec)) {
    const lead0 = dec.match(/^0+/)?.[0].length || 0;
    const rest = dec.slice(lead0);
    out += " phẩy " + Array(lead0).fill(D[0]).join(" ");
    out = out.trimEnd();
    if (rest) out += (lead0 ? " " : " ") + (rest.length <= 2 ? readInt(parseInt(rest, 10)) : rest.split("").map((c) => D[+c]).join(" "));
    out = out.replace(/\s+/g, " ");
  }
  return out;
}

if (process.argv[1]?.endsWith("vnnum.mjs")) {
  for (const t of ["143,6", "140,6", "2,13", "4.166,1", "13,66", "10,5", "5,5", "142,4", "144,8", "4.100", "4.200", "3,0", "2026", "18", "101,84", "0,83", "105", "1.005"]) console.log(t.padEnd(8), "->", readNumber(t));
}
