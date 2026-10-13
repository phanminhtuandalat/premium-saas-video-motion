#!/usr/bin/env python3
"""Ghép giọng đọc + nhạc nền (đã có SFX) -> out/vn-mix.wav.  Mốc câu đọc lấy từ <script id="spec"> trong index.html."""
import json, re, subprocess, sys, os
import numpy as np, soundfile as sf
sys.stdout.reconfigure(encoding='utf-8')
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(here, '..', '..')
spec = json.loads(re.search(r'<script id="spec" type="application/json">(.*?)</script>', open(os.path.join(here, 'index.html'), encoding='utf-8').read(), re.S).group(1))
B = 60 / spec['bpm']; sr = 48000; L = int(spec['dur'] * B * sr)
vo = np.zeros(L)
for k, beat in spec['vo'].items():
    y, r = sf.read(os.path.join(here, 'audio', 'vo', k + '.wav')); assert r == sr, (k, r)
    if y.ndim > 1: y = y.mean(1)
    s = int(beat * B * sr); e = min(L, s + len(y)); vo[s:e] += y[:e - s]
    print(f'{k}: {beat * B:6.2f}s -> {(s + len(y)) / sr:6.2f}s')
tmp = os.path.join(root, 'out', 'vn-vo-track.wav'); sf.write(tmp, np.vstack([vo, vo]).T, sr)
bed = os.path.join(root, 'out', 'vn-bed.wav'); out = os.path.join(root, 'out', 'vn-mix.wav')
fc = ('[1:a]loudnorm=I=-16:TP=-2:LRA=7,asplit=2[vo][sc];[0:a]volume=-4dB[m];'
      '[m][sc]sidechaincompress=threshold=0.02:ratio=9:attack=20:release=450[md];'
      '[md][vo]amix=inputs=2:normalize=0:duration=first[mx];[mx]loudnorm=I=-14:TP=-1.5:LRA=11[o]')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', bed, '-i', tmp, '-filter_complex', fc, '-map', '[o]', '-ar', str(sr), out], check=True)
print('OK', out)
