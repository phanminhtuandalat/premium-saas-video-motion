#!/usr/bin/env python3
"""How far the music sits under the voice while the voice is speaking.

  python3 tools/audiogap.py voice.wav music.wav [--min 6] [--max 15]

Both files are separate stems on the same timeline (the voice-over track and the music/SFX bed, before the final mix).
Measures RMS over 50 ms frames where the voice is active (above -40 dBFS) and prints the gap in dB.
Sources disagree: the stick-figure pipeline accepts 4-6 dB, the premium-motion-video skill says 8-12 dB, the
ZEROM Muse lessons say 15 dB. The defaults (6-15) only flag the clear cases; the right value for a given track needs one listen. Exit code 1 when the gap is outside [--min, --max] so a pipeline can stop.
RMS, not K-weighted LUFS, and the tool cannot judge taste: still listen once before delivering.
"""
import argparse, sys
import numpy as np, soundfile as sf

ap = argparse.ArgumentParser(); ap.add_argument('voice'); ap.add_argument('music')
ap.add_argument('--min', type=float, default=6); ap.add_argument('--max', type=float, default=15)
a = ap.parse_args()

def load(p):
    y, sr = sf.read(p, always_2d=True); return y.mean(1), sr
v, sr = load(a.voice); m, sr2 = load(a.music)
if sr != sr2: sys.exit(f'sample rates differ ({sr} vs {sr2}); resample first')
n = min(len(v), len(m)); v, m = v[:n], m[:n]
f = int(sr * 0.05); k = n // f
rms = lambda y: np.sqrt((y[:k * f].reshape(k, f) ** 2).mean(1) + 1e-12)
rv, rm = rms(v), rms(m)
db = lambda x: 20 * np.log10(x + 1e-12)
act = db(rv) > -40
if act.sum() < 10: sys.exit('no speech found in the voice stem (louder than -40 dBFS)')
gap = db(np.sqrt((rv[act] ** 2).mean())) - db(np.sqrt((rm[act] ** 2).mean()))
print(f'voice active {act.mean() * 100:.0f}% of the time; music is {gap:.1f} dB under the voice while it speaks')
if gap < a.min: print(f'TOO LOUD: music should be at least {a.min:g} dB under speech'); sys.exit(1)
if gap > a.max: print(f'TOO QUIET: music is more than {a.max:g} dB under speech and will barely be heard'); sys.exit(1)
print('OK')
