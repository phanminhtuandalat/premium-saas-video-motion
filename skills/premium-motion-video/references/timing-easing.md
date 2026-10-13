# Timing, easing and the 12 principles — lookup table for this engine

Numbers are starting points at 1080p / 60 fps. Judge by the contact sheet and by how the beat lands, then adjust ONE thing per round.

## Durations
| What moves | Duration | Notes |
|---|---|---|
| Micro-feedback (toggle, press, tick, chip pop) | 0.10–0.20 s | spring `SNAP` |
| Element entering (card, label, bar) | 0.35–0.60 s | spring `POP` or `SNAP` |
| Hero object / big number / logo | 0.8–1.4 s | spring `HEAVY` or `GLIDE`; count-ups end WHEN the voice finishes the number |
| Scene transition (push / rise / zoom / iris) | 0.5–0.9 s | next scene covers the previous; outgoing stays alive ≥ 1.6 beats |
| Exit | 60–70 % of the matching entrance | leaving is faster than arriving |
| Stagger between siblings | 0.04–0.12 s (0.08–0.25 beat) | more than 6 items: shrink the step, never exceed ~0.6 s total |
| Text dwell (readable before it moves) | ≥ 0.3 s + 0.3 s per word | VO pace ≈ 2.5 words/s; Vietnamese 2.3–2.6 |
| A "hold" with no motion | ≤ 1 s | keep something breathing (±0.5–1 % scale/offset on a slow sine) |

## Easing
| Situation | Use |
|---|---|
| Entering the frame / appearing | ease-OUT (fast start, soft landing): `VP.eOut`, `VP.eOutQuint`, springs |
| Leaving | ease-IN (slow start, fast exit) — or a spring pushed past 1 with `VP.roll` |
| Moving between two resting positions | ease-IN-OUT: `VP.ease` |
| Counters / odometers | `VP.eOut` (cubic) when synced to speech, `VP.eOutQuint` when hero-only |
| Rotations, wheels, tickers, loops | linear (the only place linear is right) |
| Anything that "has weight" | spring with damping 0.6–0.8 (small overshoot); light things 0.55–0.65, heavy 0.75–0.9 |

Engine presets (`VP.SPR`): `SNAP` 2.6 Hz / 0.8 · `POP` 2.4 / 0.62 · `GLIDE` 1.4 / 0.9 · `HEAVY` 1.2 / 0.75 · `SOFT` 1.8 / 0.85. Overshoot ≈ e^(−πζ/√(1−ζ²)): ζ 0.62 → 8 %, 0.75 → 3 %, 0.9 → 0.2 %.

## The 12 principles → what to do in `VP`
| Principle | In this engine |
|---|---|
| Squash & stretch | scale Y down while X up (keep area ≈ constant: sx = 1 + k·(1−sy)); use a spring so it rebounds (the Radfahrer stomp) |
| Anticipation | a small move the opposite way before the big one: `VP.track([[b, 0], [b+.3, -8], [b+.6, 120]])` |
| Staging | one hero per shot, everything else ≤ 60 % contrast; the eye must know where to look in 0.3 s |
| Straight-ahead vs pose-to-pose | we are pose-to-pose: keys with `track`, springs between them |
| Follow-through & overlap | stagger parts of one object (body → head → crown); let the tail settle after the body stops |
| Slow in / slow out | no `linear` except rotation; springs give it for free |
| Arcs | move along a curve: add a sine term on the perpendicular axis (±20–60 px) instead of a straight line |
| Secondary action | breathing, blinking, wheel valve, crown wobble — small, never competes with the hero |
| Timing | land hits on beats; the number of frames IS the weight (heavy = longer ease, light = snappy) |
| Exaggeration | overshoot 10–20 % on pops, squash to 0.3–0.4 on impacts; then dial back until it still reads as intentional |
| Solid drawing | same stroke widths, consistent perspective/scale across scenes; round caps and joins on everything stroked |
| Appeal | simple silhouettes that read at 300 px wide; a figure you can recognise from its outline alone |

## Audio timing
- SFX onset on the visual contact frame; whooshes peak-aligned to the cut. 12–20 dB under music. Fewer cues beat more cues.
- A silence of 0.3–0.6 s before the punchline or the drop makes the hit land harder than any extra sound.
- Music lift (`synthmusic.py --lift`) on the beat where the hero moment starts, not a bar later.
