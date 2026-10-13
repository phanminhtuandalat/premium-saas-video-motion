#!/usr/bin/env python3
"""Original, licence-free music bed — synthesised from scratch (numpy/scipy only: no samples, no API, no third-party audio).

  python3 tools/synthmusic.py --bpm 100 --beats 108 --mood corporate --lift 24 --out out/music.wav
      --bpm     film BPM (the music is written ON the film's beat grid, so cuts and hits line up with no splicing)
      --beats   length in beats (add ~2 for the tail, it fades out)
      --mood    corporate | tense | minimal | playful        (chord set, tempo feel, instrumentation)
      --lift    beat where drums + arpeggio come in (the "drop"); 0 = from the start; omit = pads/bass/sparse plucks only
      --key     root note, e.g. A, C#, F   (default depends on mood)       --seed N   deterministic variation
Output: 48 kHz stereo 16-bit WAV, true peak ≈ −3 dBTP. Feed it to tools/mix.py as --music (mix.py does the loudness).
Everything here is generated, so the result is yours to use commercially. It is a bed, not a hit song: pair it with SFX and a voice.
"""
import argparse, sys
import numpy as np
from scipy.signal import lfilter
import soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument('--bpm', type=float, required=True); ap.add_argument('--beats', type=float, required=True)
ap.add_argument('--mood', default='corporate', choices=['corporate', 'tense', 'minimal', 'playful'])
ap.add_argument('--lift', type=float, default=None); ap.add_argument('--key', default=None)
ap.add_argument('--seed', type=int, default=7); ap.add_argument('--tail', type=float, default=2.0)
ap.add_argument('--out', default='out/music.wav'); a = ap.parse_args()

SR = 48000; spb = SR * 60 / a.bpm; N = int((a.beats + a.tail) * spb) + SR // 2
rng = np.random.default_rng(a.seed)
NOTE = {'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11}
MOODS = {  # scale degrees (semitones from the key root) of each bar's chord root + chord quality; default key
    'corporate': dict(key='C', prog=[(0, 'M'), (7, 'M'), (9, 'm'), (5, 'M')], pad=.55, arp='up', kick=1, clap=True, hat=True),
    'tense':     dict(key='A', prog=[(0, 'm'), (8, 'M'), (3, 'M'), (10, 'M')], pad=.6, arp='pend', kick=1, clap=False, hat=True),
    'minimal':   dict(key='D', prog=[(0, 'm'), (0, 'm'), (5, 'm'), (0, 'm')], pad=.5, arp='sparse', kick=0, clap=False, hat=False),
    'playful':   dict(key='G', prog=[(0, 'M'), (5, 'M'), (7, 'M'), (5, 'M')], pad=.4, arp='bounce', kick=1, clap=True, hat=True)}
M = MOODS[a.mood]; root = NOTE[(a.key or M['key']).upper()]
hz = lambda midi: 440.0 * 2 ** ((midi - 69) / 12)
out = np.zeros((2, N))

def add(sig, start, gain=1.0, pan=0.0):
    s = int(start); e = min(N, s + len(sig))
    if e > s: out[0, s:e] += sig[:e - s] * gain * np.cos((pan + 1) * np.pi / 4); out[1, s:e] += sig[:e - s] * gain * np.sin((pan + 1) * np.pi / 4)

def env(n, att, rel):
    e = np.ones(n); a_, r_ = max(1, int(att * SR)), max(1, int(rel * SR))
    e[:a_] = .5 - .5 * np.cos(np.linspace(0, np.pi, min(a_, n))); e[-r_:] *= .5 + .5 * np.cos(np.linspace(0, np.pi, min(r_, n))); return e

def pad(f, dur, det):
    t = np.arange(int(dur * SR)) / SR; y = sum(np.sin(2 * np.pi * f * det * h * t + rng.uniform(0, 6.28)) / h ** 1.35 for h in range(1, 7))
    return y * env(len(t), .35 * spb / SR, .3 * spb / SR)

def pluck(f, dur=.5):
    t = np.arange(int(dur * SR)) / SR; return sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t * (7 + 5 * h)) / h for h in range(1, 6))

def bass(f, dur):
    t = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)) * env(len(t), .01, .12) * np.exp(-t * 1.6)

def kick():
    t = np.arange(int(.32 * SR)) / SR; fr = 45 + 90 * np.exp(-t * 28); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 11)

def noise_burst(dur, hp, decay):
    n = rng.standard_normal(int(dur * SR)); y = np.diff(n, prepend=0) if hp else n; return y * np.exp(-np.arange(len(n)) / SR * decay)

def chord(sem, q):  # triad as semitone offsets from the chord root
    return [0, 4 if q == 'M' else 3, 7]

bars = int(np.ceil((a.beats + a.tail) / 4)); lift = a.lift
PAD = np.zeros((2, N)); mainout = out
for bar in range(bars):
    cs, q = M['prog'][bar % 4]; base = 48 + root + cs; start = bar * 4 * spb; ch = chord(cs, q)
    for k, off in enumerate(ch + [12]):
        for ci, det in enumerate((.997, 1.003)):
            y = pad(hz(base + off), 4.15 * spb / SR, det) * (.16 * M['pad']) / (1 + .15 * k)
            n = len(y); s = int(start); e = min(N, s + n)
            if e > s: PAD[ci, s:e] += y[:e - s]
PAD = lfilter([.12], [1, -.88], PAD, axis=1)                                     # one-pole low-pass: warm pad
out += PAD
for bar in range(bars):                                                          # bass: roots on 1 and 3 (8ths after the lift)
    cs, q = M['prog'][bar % 4]; f = hz(36 + root + cs)
    for b8 in range(8):
        beat = bar * 4 + b8 * .5; after = lift is not None and beat >= lift
        if (b8 in (0, 4)) or (after and b8 in (2, 3, 6, 7) and a.mood != 'minimal'):
            add(bass(f * (2 if b8 in (3, 7) else 1), .5 * spb / SR * (1 if b8 in (0, 4) else .6)), beat * spb, .30 if b8 in (0, 4) else .2)
def arp_pattern(kind, ch, bar):
    o = [0, 1, 2, 1, 0, 1, 2, 3] if kind in ('up', 'bounce') else [0, 2, 1, 2, 0, 2, 1, 2] if kind == 'pend' else [0, None, None, None, 2, None, None, None]
    return [(i * .5, None if x is None else ch[x % 3] + 12 * (x // 3) + (12 if kind == 'bounce' and i % 2 else 0)) for i, x in enumerate(o)]
for bar in range(bars):                                                          # plucks: quarter-note sparkle before the lift, 8th arpeggio after
    cs, q = M['prog'][bar % 4]; ch = chord(cs, q); base = 60 + root + cs
    for i, off in arp_pattern(M['arp'], ch, bar):
        beat = bar * 4 + i; after = lift is not None and beat >= lift
        if off is None: continue
        if not after and (i % 1.0 != 0 or (int(i * 2) % 4 != 0)): continue
        add(pluck(hz(base + off)), beat * spb, .2 if after else .08, pan=-.35 if int(i * 2) % 2 else .35)
if lift is not None:
    for beat in np.arange(int(lift), int(a.beats + a.tail), 1.0):                # drums from the lift on
        if M['kick'] or beat == lift: add(kick(), beat * spb, .85)
        if M['clap'] and int(beat - int(lift)) % 2 == 1: add(noise_burst(.14, False, 26) * .7 + noise_burst(.14, True, 30) * .3, beat * spb, .34)
        if M['hat']:
            for off in (.5,): add(noise_burst(.05, True, 70), (beat + off) * spb, .2)
    rs = int(max(0, lift - 2) * spb); re_ = int(lift * spb)                       # riser into the lift
    if re_ > rs:
        n = np.diff(rng.standard_normal(re_ - rs), prepend=0) * np.linspace(0, 1, re_ - rs) ** 2.2; add(n, rs, .22)
    add(kick() * 1.0, lift * spb, .0)

peak = np.abs(out).max() + 1e-9; out = np.tanh(out / peak * 1.6) / np.tanh(1.6)  # soft-clip glue, then normalise to ≈ −3 dBFS
from scipy.signal import resample_poly
tp = np.abs(resample_poly(out, 4, 1, axis=1)).max()                             # true peak (4× oversampled), not just the sample peak
out *= 10 ** (-3 / 20) / (max(tp, np.abs(out).max()) + 1e-9)
L = int((a.beats + a.tail) * spb); out = out[:, :L]
fi = int(.04 * SR); fo = int(a.tail * spb); out[:, :fi] *= np.linspace(0, 1, fi); out[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
import os; os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
sf.write(a.out, out.T.astype(np.float32), SR, subtype='PCM_16')
print(f'OK {a.out}  mood={a.mood} key={(a.key or M["key"]).upper()} bpm={a.bpm} {L / SR:.1f}s lift={a.lift}')
