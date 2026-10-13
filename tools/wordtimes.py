#!/usr/bin/env python3
"""Word-level timestamps for voice-over clips (local faster-whisper, no API key).

  python3 tools/wordtimes.py examples/<film>/audio/vo --script examples/<film>/audio/vo/vo-raw.json --out examples/<film>/words.js
      <dir>      folder of <id>.wav clips (one per sentence)
      --script   optional JSON {id: "text"} or {id: {"text": "..."}}; the KNOWN script is aligned onto Whisper's
                 timings, so the words you see on screen are exactly your words (Whisper only supplies the clock)
      --out      .js -> `window.WORDS = {...}` (page loads it with <script src>) ; .json -> plain JSON
      --model    tiny|base|small|medium (default small; Vietnamese needs >= small)  --lang vi
Result per clip: [[word, t0, t1], ...] in seconds from the clip start.
First run downloads the model from Hugging Face (small ~480 MB), later runs are offline.
"""
import argparse, difflib, json, os, re, sys, unicodedata
sys.stdout.reconfigure(encoding='utf-8')
ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('--script'); ap.add_argument('--out', required=True)
ap.add_argument('--model', default='small'); ap.add_argument('--lang', default='vi'); a = ap.parse_args()
from faster_whisper import WhisperModel

norm = lambda w: re.sub(r'[^\w]+', '', unicodedata.normalize('NFC', w).lower())
script = {}
if a.script:
    for k, v in json.load(open(a.script, encoding='utf-8')).items(): script[k] = v['text'] if isinstance(v, dict) else v
ids = sorted(f[:-4] for f in os.listdir(a.dir) if f.endswith('.wav') and not f.endswith('_raw.wav'))
model = WhisperModel(a.model, device='cpu', compute_type='int8')
out = {}
for k in ids:
    segs, info = model.transcribe(os.path.join(a.dir, k + '.wav'), language=a.lang, word_timestamps=True, beam_size=5,
                                  initial_prompt=script.get(k), condition_on_previous_text=False)
    ww = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if w.word.strip()]
    dur = info.duration
    if k not in script: out[k] = [[w, round(s, 3), round(e, 3)] for w, s, e in ww]; continue
    toks = script[k].split()
    sm = difflib.SequenceMatcher(None, [norm(t) for t in toks], [norm(w) for w, _, _ in ww], autojunk=False)
    t0 = [None] * len(toks); t1 = [None] * len(toks)
    for blk in sm.get_matching_blocks():
        for j in range(blk.size): t0[blk.a + j], t1[blk.a + j] = ww[blk.b + j][1], ww[blk.b + j][2]
    hit = sum(x is not None for x in t0)
    i = 0                                     # interpolate unmatched tokens between matched neighbours
    while i < len(toks):
        if t0[i] is not None: i += 1; continue
        j = i
        while j < len(toks) and t0[j] is None: j += 1
        lo = t1[i - 1] if i > 0 else 0.0; hi = t0[j] if j < len(toks) else dur
        n = j - i
        for q in range(n): t0[i + q] = lo + (hi - lo) * q / n; t1[i + q] = lo + (hi - lo) * (q + 1) / n
        i = j
    out[k] = [[toks[q], round(t0[q], 3), round(max(t1[q], t0[q] + .05), 3)] for q in range(len(toks))]
    print(f'{k}: {hit}/{len(toks)} words matched to Whisper, {len(ww)} Whisper words, clip {dur:.2f}s')
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
with open(a.out, 'w', encoding='utf-8') as f:
    js = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    f.write(('window.WORDS=' + js + ';\n') if a.out.endswith('.js') else js)
print('OK', a.out)
