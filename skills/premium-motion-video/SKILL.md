---
name: premium-motion-video
description: Use when asked to make a product intro, launch/promo video, SaaS feature video, app preview, UI micro-loop for social, logo reveal or any brand-styled motion piece rendered from code (HTML → MP4), especially from a product's source repo, brand assets, screenshots or photos. Always runs ONE intake first (mode, format, language, voice-over, length, music, CTA), then works without further questions.
---

# Premium Motion Video

Tác giả: **Đặng Hữu Sơn** — CEO LovinBot AI (https://www.facebook.com/danghuuson.182/)

Premium = **the brand's own look + intention + varied, well-timed motion + one idea per shot**, rendered deterministically.
Every frame is a pure function of time `seek(t)`: the same HTML plays live, renders frame-exact to MP4,
and can be reviewed as a contact sheet in seconds.

Full toolkit (engine, templates, renderer, audio tools, worked examples) lives in the user's repo
**VideoPremium Intro** (`C:/Users/PHANMINHTUAN/Documents/Videomotion/premium-saas-video-motion`):
`engine/motion.js`, `templates/kinetic-promo` (JSON-driven Apple-style promo, any aspect),
`templates/keynote-oneshot` (one continuous take), `examples/globalspeak` (60 s SaaS film, mode A: rebuilt interactive UI),
`examples/globalspeak-real` (same product, mode B: real screenshots only), `examples/aibannerpro` (dark SaaS, mode A + illustrative outputs),
`examples/vibesketch` (60 s Sketchbook-style film from a repo: paper, pencil, marker, stop-motion, scribble wipe),
`examples/cnv` (60 s hybrid film built from a public marketing site only: real mockups + rebuilt automation/ZNS/CDP scenes),
`templates/ui-loops` (8 product-UI micro-loops, 8 s seamless loop: 4:5 board or `?fx=N` single 1:1 effect, `?poster`),
`tools/render.mjs · sheet.mjs · capture.mjs · beatgrid.py · cues.mjs · mix.py · popcheck.py`,
`assets/audio/` (embedded music + SFX library with pre-computed BPM/drops in `library.json`, default `sfx.json`),
`skills/premium-motion-video/references/` (aesthetics, motion-cookbook, pipeline, gotchas, reference-leo, reference-ui-loops, tts-integration, windows-setup, prompt-and-review, short-explainer-recipe).
If the repo is reachable, use it. If not, the minimal engine + renderer at the end of this file are enough.

## Step −1 — Post a checklist before doing anything
Before the first tool call that does real work, post a short checklist (task list tool if available, else a message).
Mark items done as you go and end the job with the checklist showing ✅ / ⏳ / ❌ per item. Group items into **lanes**
that do not depend on each other and hand independent lanes to sub-agents in parallel (one message, several agents);
waiting on one lane at a time is the main cause of slow jobs. Typical lanes:

| Lane | Items | Depends on |
|---|---|---|
| L1 Intake | ask Q1–Q4 + length, music, CTA in ONE message; tell the user it takes a while | — (blocks everything visual) |
| L2 Brand & story | read tokens, logo, README/docs/routes, pick 6–10 features, write beat map | intake |
| L3 Screens | ask permission → `tools/capture.mjs` → `capture/` folder + manifest (mode B/C, and mode A reference) | intake, permission |
| L4 Audio | pick track from `assets/audio/library.json`, splice plan (`beatgrid.py --plan`), CUES → SFX map | beat map length |
| L5 Build | scenes (split by scene ranges across agents when long), contact sheet, fixes | L2, L3 |
| L6 Render & QA | preview → final per format (16:9 and 9:16 in parallel), popcheck, loudness, delivery encodes | L5, L4 |
Sub-agent brief = the checklist item + exact inputs/outputs (paths) + acceptance check; they return paths, not prose.
L4 Audio also covers the voice-over when there is one (script → VO file → timings → ducked mix, see "Voice-over").

## Working style — ask once, then focus
- **All questions go into ONE message** (the intake below). No drip-fed follow-ups: anything the intake didn't settle,
  decide with a sensible default and state it in the delivery.
- Right after the intake, tell the user plainly (in their language): the job takes a while (typically 20–40 min for a
  60 s film: research, build, QA, 1080p60 render), they can go do other work and come back — the checklist shows progress.
- Beat map, capture contact sheet and stills are sent as **FYI, not gates**: keep working. Stop only for a real
  blocker (missing file the user must provide, a permission, an irreversible choice).
- Model notice (include once, in the intake message or the delivery): for best quality with this skill use
  **Claude Opus 5.5 or Claude Sonnet 5.5**; on ChatGPT use **Astra 6 medium or GPT 6.1 sol medium or higher**.

## Step 0 — Intake (MANDATORY, ONE message, before any design or code)
Ask everything in ONE message (use the ask-question tool if available; if it caps the number of questions, put the
rest in the same message as short text options), skipping only what the prompt already states. Never silently assume
Q1–Q4 — a wrong answer here costs a full re-render.

**Q1 · Presentation mode** (explain the trade-off in one line each):
| Mode | What it is | Best for | Cost / risk |
|---|---|---|---|
| **A · Rebuilt UI ("live mockup")** | Key screens re-created in HTML with the product's tokens; buttons press, cards grow, numbers count, cursor clicks feel real | Launch/promo, ads, feature hype; products whose UI changes often | Longer build; UI is a faithful re-creation, not pixel-identical — say so |
| **B · Real screenshots ("guided walkthrough")** | Unmodified screenshots in a browser/phone frame; motion from camera zooms, spotlights, cursor clicks, in-frame page changes | Onboarding, sales demos, docs videos, "must look exactly like the app" | Needs good screenshots (ideally 2× DPR); nothing inside the UI moves |
| **C · Hybrid** (default if user has no preference) | B for context/wide shots + A for the 2–3 hero moments (the click that matters, the number that counts) | Most SaaS intros | Must match tokens exactly so A-shots don't look different from B-shots |

**Q2 · Format** (if not given). Recommend delivering **two versions from one build**: 16:9 1920×1080 (desktop UI,
YouTube/web/LinkedIn) + 9:16 1080×1920 (mobile UI, Reels/TikTok/Shorts). Also offer 1:1 / 4:5 for feed. Mobile version
uses mobile screens (390×844 viewport) — not a cropped desktop frame.

**Q3 · Main language** of on-screen text (and whether UI labels stay in the product's own language). Pick fonts that
cover it (Vietnamese: Be Vietnam Pro / Inter / IBM Plex Sans; Geist on Google Fonts lacks full Vietnamese) and keep
brand wordmarks in the brand font.

**Q4 · Voice-over (VO)** — always ask:
| Option | What happens | What the user must provide |
|---|---|---|
| **No VO — music + SFX only** (default) | Film is cut to the music; on-screen text carries the message | nothing |
| **VO via ElevenLabs** | Claude writes the VO script, generates the voice, cuts the film to it | ElevenLabs connected (the ElevenLabs connector/MCP, or an API key set up for the session) + a voice choice (voice name/ID, or "pick one": male/female, tone, pace). If not connected yet, say how to connect it; meanwhile build to the script timing and drop the VO in when it arrives |
| **VO self-upload** | User supplies the recorded VO (mp3/wav); film is cut to it | Upload the audio file in the chat, **or** copy it into `<film>/audio/vo/` (e.g. `examples/<film>/audio/vo/vo.mp3`) in the connected folder, and say when it is there. If they want a script to record from, Claude writes it first |
For ElevenLabs/self-upload also ask in the same message: VO language/tone, and whether Claude writes the script (default yes).

**Also in the same message (if unknown):** length (default 45–60 s), music (library mood or the user's file),
CTA text + URL/hotline for the end card, and permission to capture screens locally if that will be needed.

**Length is a target, not a contract:** "60 s" means roughly 50–90 s is fine (±10–30 s). Let the story, the music
phrasing (end on a bar/phrase boundary, e.g. 100 beats) and the VO decide; never cram or pad to hit an exact second.

If the session is unattended, use defaults — mode C, 16:9 + 9:16, the language of the user's prompt, no VO — and state
them at the top of the delivery.

## Spec first — a second-accurate shot list (after the intake, before any build)
Turn the answers into `<film>/video-spec.md` — one table, one row per shot, so every later gate has something to check against:
| # | t0–t1 (s or beat) | on screen (what, where, hero motion) | VO line | sound (music · sfx) | cut to next |
Fill the three things vague briefs leave out: **audience + platform + length**, the **one message** a viewer must keep, and **counter-examples**
("not slick/corporate — dry, a bit mean"). Push back on empty words ("premium", "dynamic") by asking for a reference or a number.
When the user changes something, edit the row and check whether the neighbouring shots still work (timing, cut, VO) before touching code.
Data films: this table is also the figure-by-figure sign-off table of step 5.

## Screens phase — capture first, build second (all modes)
Every mode starts from real screens collected into ONE folder (`<film>/capture/{desktop,mobile}/*.png` + `manifest.json`):
mode B/C use them in the film, mode A uses them as the reference to rebuild from.
1. Inventory what exists: repo screenshots (`docs/`, README images, `public/`, Storybook). Copy the usable ones in.
2. If screens are missing, too small (< 2× DPR) or no mobile set exists: **ask permission first** (in the intake message)
   ("I'd like to start your app locally in demo/seed mode and capture N screens with a headless browser — OK?"). Only then write a
   `capture.config.json` (see `templates/capture.config.example.json`: routes, demo login, actions such as clicking a
   slot, `mask` selectors for emails/phones/payment) and run `node tools/capture.mjs capture.config.json`
   (desktop 1440×900 @2×, mobile 390×844 @3×, animations off, fonts settled). Never point it at production data.
3. Fallbacks: the public marketing site (download its product images/mockups, crop the UI out of marketing composites),
   or ask the user to drop screenshots into the folder.
4. Review a contact sheet of the capture folder yourself before building; send it to the user as FYI (not a gate).

**Mode A fidelity rule:** rebuild each hero screen from its capture, not from imagination — same layout grid, spacing,
radius, font sizes, colours and real labels (read the page component for exact text). Check by overlaying the rebuilt
frame on the screenshot at 50 % opacity (or side-by-side sheet) at the shot's final pose; fix until they match, THEN add
motion (button press, card grow, number count, cursor). Illustrative data only where the capture shows demo data.

## Workflow — each gate is cheap, skipping one is expensive
1. **Intake** (above, one message) → mode, format(s), language, VO, length, music, CTA. Then announce the wait and work.
2. **If there is a source repo (SaaS mode)** — read before designing:
   - Brand: `globals.css` / Tailwind theme / CSS variables → exact colours, radius, font; `public/logo.svg`.
     Use the real logo file; animate its parts in place, never redraw or recolour it.
   - Story: README, docs/user guides, CHANGELOG, route list (`app/**/page.tsx`), UI labels in the key pages.
   - Screens: see "Screens phase" (capture folder first). Never show real customer data.
   - Pick 6–10 features, one scene each. Desktop scenes: browser/laptop, cursor, zoom into one card at a time.
     Mobile scenes: phone frame, taps, sheets, notifications. A laptop→phone "real-time" beat sells sync.
   - Also mine real product outputs (sample videos → frames, word-timing JSON, generated images, mascots/characters).
   - Mode B camera kit: shots table `[beat, rect-in-screenshot-px | null]` → camera fits the rect under the headline
     (zoom ≤ 1.7 on 1× screenshots), spotlight = rounded rect with a 4000 px dim box-shadow + brand-colour border,
     spotlight opacity tracked as a spring (never reset per shot → avoids flashes), page changes = vertical push inside
     the frame, cursor mapped through the camera. Headline band at the top so zoomed UI never collides with text.
3. **Pick the playbook from the brand** (table below), then a template/example to start from.
4. **Music first** (skip for silent social loops): pick from the embedded library (`assets/audio/library.json`: mood,
   good_for, BPM, drop, breakdowns, energy per bar — no re-analysis needed) or the user's file (`tools/beatgrid.py`); set film BPM =
   song BPM, put the hero moment on the drop / energy lift, splice bars only with matching bar phase
   (`film_beat % 4 == track_beat % 4`). With VO: fix the VO length first, then fit the music to it.
   **No track with a licence you can ship?** Write an original one: `python3 tools/synthmusic.py --bpm <film bpm> --beats <film beats + 2> --mood corporate|tense|minimal|playful --lift <drop beat> --out out/music.wav`
   (numpy only; composed on the film's own beat grid so no splicing; drums + arpeggio enter at `--lift`, ≈ +4 dB; true peak −3 dB; pass it to `mix.py --music`).
   It is a bed, not a hit — keep it under SFX/voice, and listen before delivering (the tool cannot judge taste).
5. **Beat map + stills** (FYI, not a gate): table beat | VO line | music | image | sfx, plus 3–4 stills. Send it and
   keep building; fold any reply into the next round.
   **Data films (numbers are the content) — the one exception: make it a gate.** Before building, send the table
   scene | number as it will read on screen | VO phrase | source figure, and wait for OK (a wrong figure costs a full re-render and a
   wrong claim). Keep every figure in ONE file (`<film>/data.js` → `window.DATA`); the film code never types a number.
6. **Build → contact sheet** (`sheet.mjs --every 2`, then `--every 0.5` around transitions; add `--safe` for 9:16 to overlay the
   platform-UI zones — top 11.5 %, bottom 20 %, right 11 % — and keep text/captions out of them or say so). Fix everything visible.
   **Always:** `node tools/audit.mjs <film>/index.html` on SETTLED moments (the film lists them in `window.AUDIT = {beats, safe, safeExempt, minFont}`):
   exit 1 on text overlapping text, cut off horizontally, off the canvas or outside the safe area; warns on effective font < 26 px.
   Only "visible" text counts (a scene covered by the next one is ignored); line boxes are measured on the glyph band so tight headlines don't false-alarm.
   **Data films:** `node tools/checkdata.mjs <film>/index.html` — every figure in `window.EXPECT` (copied BY HAND from the source
   text, never generated from DATA) must be on screen at its beat, plus the arithmetic identities. Exit 1 = do not render.
7. **Preview render** (half size, 30 fps) → **final** (60 fps, 2 sub-frames motion blur) with audio →
   `popcheck.py` (0 pops, loop seam) → loudness ≈ −14 LUFS → deliver MP4 + HTML source.

## Voice-over (when Q4 ≠ no VO)
1. **Script first.** One idea per sentence, matching the beat map scenes. Vietnamese reads ≈ 2.3–2.6 words/s
   (60 s ≈ 140–160 words incl. pauses); English ≈ 2.5 words/s. Leave 1.5–2 s of VO-free air on the logo/CTA.
2. **Get the audio.** ElevenLabs: list voices, pick the one the user chose (or the closest match to their description and
   say which), generate per scene/sentence (easier to retime) or one take; save to `<film>/audio/vo/`. Self-upload: read
   it from the chat upload or `<film>/audio/vo/`. Local Vietnamese TTS (VieNeu Studio, `POST :8001/api/tts`) is free and fast, but
   it mispronounces foreign words and brand names: write the Vietnamese respelling into the TTS text (keep the true spelling on screen),
   or voice those lines with ElevenLabs (multilingual) and cut them into the same timeline. Always spell numbers out in words for TTS.
3. **Timings.** Get word timestamps — never estimate by character count. Local, no key:
   `python3 tools/wordtimes.py <film>/audio/vo --script <film>/audio/vo/vo-raw.json --out <film>/words.js`
   (faster-whisper; your KNOWN script is aligned onto Whisper's clock, so on-screen words are exactly yours; one clip per
   sentence, `pip install faster-whisper`, first run downloads the model). The film loads `words.js` (`window.WORDS`) and
   anchors visuals to phrases (`phr('s4','ba mươi sáu phẩy bảy phần trăm')` → [startBeat, endBeat]); counters END when the voice
   finishes the number. Scene starts snap to sentence starts rounded to the nearest beat. Pick music BPM/splice after the VO
   length is known. Whisper writes digits for spoken numbers, so those words are interpolated between matched neighbours — fine
   for a phrase window, don't rely on single-syllable precision there.
4. **Mix.** VO is the lead: music ducked 8–12 dB under speech (e.g. ffmpeg
   `[music][vo]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400`), SFX lighter than without VO, final
   loudness ≈ −14 LUFS with VO peaks ≈ −1.5 dBTP. Check intelligibility on laptop speakers.
5. Burned-in karaoke captions come free from `words.js` (Vietnamese: keep diacritics, ≤ 2 lines, ≥ 44 px at 1080p; pages split at
   punctuation, current word highlighted; `"captions": false` in the film's spec turns them off). In 9:16 captions sit in the
   bottom platform-UI zone — check with `sheet.mjs --safe` and tell the user.

## Brief, critique and continuity — see references/prompt-and-review.md
- Spec opens with the 9-layer brief (role · goal · format · story · art direction · motion language · negatives · technical limits · QA loop).
- After the first build, switch to a critic role: findings by category, with timestamps, ranked P0 / P1 / P2; fix P0 → P1, one named defect per round.
- Pick 2–3 transition families and one recurring motif; bridge scenes with an object already on screen.
- 3D (Three.js) only when it has a job: `engine/scene3d.js`, shot type `scene3d`, camera and particles are pure functions of the beat (`VP.rng`, no Clock/mixer).

## Style comes from the brand, not from a house style
The first design decision is the **style family**, read from the brand: fonts, textures, illustration assets,
UI tone, audience. Apple-keynote minimalism is ONE playbook, not the rule. Match the product:

| Brand signals | Playbook | Signature moves |
|---|---|---|
| Clean SaaS, sans UI, lots of white/cream | **Keynote** | springs, liquid glass, shared-element morphs, screen-studio zooms, word-by-word type |
| Hand-drawn / doodle / paper / handwriting font | **Sketchbook** | paper texture, pencil-reveal of art + handwriting, line boil at 8 fps, red-marker circles/underlines/ticks, sticky notes with tape, stop-motion pops at 12 fps, page slides, ink scribble wipe |
| Magazine, serif, photography | **Editorial** | big serif headlines, grid reveals, split-screen, masked photo wipes, pull quotes, slow push |
| Youth/social, loud colours, stickers | **Kinetic social** | hard cuts on the beat, colour blocks, giant type, sticker pops, speed ramps, 9:16 first |
| Dev tools, API, terminal | **Tech** | mono type, typing terminals, code diffs, node graphs, neon-on-dark accents |
| Kids/edu/mascots | **Playful** | squash & stretch, bouncy springs (low damping), characters reacting, doodle arrows |
| Social post about a feature, design-tool feel, 4:5 / 1:1, no audio | **UI micro-loop** | real UI states morphing (button→player, bars→line, KPI zoom, dock, glass lens, flow pulses, particle mark), mono annotation labels, cream/navy + 1 warm + 1 cool accent, fwd/hold/ret 8 s loop |

Mix at most two playbooks per film (e.g. Sketchbook + a Tech terminal beat, Keynote + UI-loop scenes). Brand colours,
fonts and real assets (logo, characters, screenshots, sample outputs) always win over playbook defaults.

## Variety rule (a 60 s film needs many kinds of motion)
- Aim for **8–12 distinct effect types per minute**; never the same entrance three scenes in a row.
- Rotate transitions: camera pan across one continuous canvas, push, rise, page slide, zoom-through a tile/logo/
  button, iris, scribble/ink wipe, shared-element morph, hard cut on a drop. Use the loudest one on the music drop.
- Alternate density: busy scene (grid, wall, many cards) → quiet scene (one line, one object) → busy.
- Mix time feels: smooth 60 fps springs for camera/UI, stepped 8–12 fps for hand-made elements (boil, stop-motion).
- Give every scene one "hero" motion and at most two supporting ones.

## Explainer figures — skill `anatomy`
For a scene that explains a technical idea (cache, queue, rate limiter, sensor loop) as a physical machine, use the sibling skill `skills/anatomy/` (`/anatomy <description>`). Output is standalone HTML/SVG; bring it into a film as a still or footage frames (`tools/clipframes.mjs`) or re-draw it with `VP.*` so every frame stays a function of `seek(t)`. It does not draw charts or people.

## UI micro-loops (format and scene kit) — see references/reference-ui-loops.md
- Each effect is `draw(w, h, id, S)` with `S = VP.cycle(t, {F:2.2, H:4.4, R:1.4, loop:8, offset})`:
  slow eased forward, long hold where ONE thing stays alive, faster return; F+H+R = loop → exact seam.
- The motion must explain a UI state change the viewer already understands; demo numbers labelled "illustrative".
- Add a small mono annotation layer (`shape morph`, `wdth 62`, `gaussian falloff`) — reads as design craft.
- All text measured with `VP.fitText`; seeded randomness only (`VP.rng`); a poster state that reads when paused.
- Reuse inside long films: drive `S` from the film clock for a scene (e.g. dashboard zoom, glass focus on a report row,
  flow pulses for integrations, particle mark as the end card).

## Craft rules (all playbooks)
- One idea per shot, key object readable, space to breathe; background never fights the subject.
- Type at 1080p: hero 150–250 px, stats 280–360 px, headlines/captions 60–80 px, labels ≥ 26 px on cards. If a
  300-px-wide thumbnail can't be read, it's too small.
- Every motion eased or springy; overlap with 0.08–0.25-beat staggers. Linear only for deliberate mechanical moves.
- Text changes = masked rolls, reveals or hand-writing, not cross-fades.
- Adaptive rhythm: calm open → dense middle → air on the logo; no hold > 1 s without some motion.
- Show the real product: real screenshots, real sample outputs (frames from an example video), real characters/assets.
- BPM feel: 60–80 cinematic · 90–110 smooth · 113–123 kinetic (tech default) · playful tracks for doodle/edu brands.
- Sound: default SFX map `assets/audio/sfx.json` (swoosh, swoosh-deep, click, tick, typing, notify, hit, boom, rise, pop,
  coin, unlock…; `mix.py` uses it when `--sfx` is omitted). Few SFX, 12–20 dB under the music; whooshes peak-aligned to transitions, one boom on the drop, one hit on
  the logo; no "ting" clusters; fade music ~1.5 s after a logo ending.
- **The CTA end shot is the money shot:** never a static card. A cursor (or finger tap on mobile) glides in on an eased
  path → hover (button lifts 2–4 px, glow/shine sweep) → press (scale ≈ 0.94, ripple from the click point, `click` SFX on
  the beat) → release into a success state (label rolls to "✓ Đã đăng ký" / "Đang kết nối…", confetti or particle burst in
  brand colours, `hit`/`unlock` SFX) → hold ≥ 1.5 s on logo + URL/hotline, music tails out. Build it with the film's own
  cursor and `VP.sp`, not a GIF.
- Say plainly what is illustrative (demo numbers, chat lines) and flag third-party music/photos as internal-use unless
  licensed. Reference kits (e.g. other creators' boards) are inspiration: re-implement, never copy their code/art.

## Effect catalogue (all built with the engine below)
pencil-reveal (clip inset + pencil sprite riding the edge) · hand-lettering reveal · SVG path draw (marker underline,
circle, tick, arrows, roads) · line boil (3 feTurbulence filters cycled at 8 fps) · stop-motion time `Q(b)` quantised
to 12 fps · sticky notes with tape flying in on springs · typewriter + caret · 7-step roadmap with a travelling dot and
panning camera · character grid pops · waveform bars · language roller · karaoke highlight from word timings ·
real video frames in a phone (pre-extracted jpgs indexed by time) · book cover/page flips (scaleX) · hatched progress
bar in steps · marquee wall of cards (rows opposite directions, tilted) · terminal typing · aspect-ratio morph
(9:16→16:9→1:1 via rect track) · strike-through scribbles · ink scribble wipe (stroke-width 300 path drawn, then erased)
· logo zoom-through · liquid glass · iris · shared-element grow from a button · odometer counters · glow fields ·
CTA click money shot (cursor glide → hover → press ripple → success burst) · template-variable → real-name roll
(`{{customer_name}}` → "Phú Nguyễn") · automation flow nodes with pulses along bezier connectors ·
**UI loops:** button→player morph · search typing→results stack · card→workspace · sliding tab pill + panel swap ·
bars→line chart morph (Catmull-Rom) · dashboard KPI zoom with corner brackets · spring card stack · magnetic dock
(gaussian) · masked type (content moving inside letters) · elastic per-letter stretch on a baseline · text→layout ·
soft-edge image reveal · perspective layer stack (bilinear quads) · glass focus lens (blur outside, sharp+magnified
inside) · flowing path pulses with node rings · particle logo from sampled points.

## Motion toolkit (engine/motion.js → `VP.*`)
| Need | Use |
|---|---|
| Spring 0→1 at a beat | `VP.sp(beat, f, z)`; presets SNAP 2.6/.8 · POP 2.4/.62 · GLIDE 1.4/.9 · HEAVY 1.2/.75 |
| Multi-key motion, no jumps | `VP.track([[beat, value|array, f, z], ...])` (superposed springs) |
| Shared-element morph | one element, rect keys `[x,y,w,h,r]` through `track`, `VP.place(el, rect)` |
| Masked roll | parent `overflow:hidden` + `VP.roll(inner, k, h)` (0 below → 1 in → 2 gone above) |
| Word-by-word headline | `<span class=mask><span>word</span></span>`, translateY((1−sp)·105%) |
| Screen-studio zoom | `VP.camera(camLayer, z, fx, fy)` — captions live in a HUD layer OUTSIDE the camera |
| Counters / odometer | eOutQuint over 2 beats; odometer columns staggered right→left |
| Glow fields | `radial-gradient(closest-side, c, transparent)` — never `filter: blur()` |
| Liquid glass | `VP.glass(el, rect, backdropEl, uiHTML)` (cloned backdrop + SVG displacement) |
| Wordmark squeeze | variable font `wdth` axis (e.g. Archivo 62..125) driven by a spring |
| Loop state machine | `VP.cycle(t,{F,H,R,loop,offset})` → `{phase, p, h, ret, T}`; `VP.stagger(p,i,n,spread,'center')` |
| Text that always fits | `VP.measure(text, font)`, `VP.fitText(text, family, weight, maxW, size, min)` |
| Smooth data lines | `VP.catmull(pts)`, `VP.partial(poly,k)`, `VP.dpath(poly)` |
| Deterministic randomness / falloff | `VP.rng(seed)` (mulberry32), `VP.gauss(x,c,s)` |
| Fake 3D planes / particle marks | `VP.quad`, `VP.plane`; `VP.sampleText(text, font, w, h, step)` |

GSAP (free incl. Flip/SplitText/DrawSVG/MorphSVG) is fine as an authoring layer: build ONE paused master timeline at
load and make `seek(t)` call `tl.seek(t)`; compute Flip states at build time; no ScrollTrigger; springs via a custom
ease. It speeds authoring, not rendering.

## Speed rules (measured)
- Never await requestAnimationFrame inside `seek()` — screenshots already wait for paint (5× faster, identical pixels).
- CDP `Page.captureScreenshot {format:'jpeg', optimizeForSpeed:true}`; one Chromium per CPU core; chunked + resumable.
- 2 sub-frames for motion blur (ffmpeg `tmix`), not 4. Preview = ½ size, 30 fps, no blur.
- Long renders: start in the background (`nohup … &`) and poll; never one blocking shell call under a timeout.
- Reference: 20 s 1080p60 ≈ 2.5 min, 62 s ≈ 8 min, 8 s 1080×1350 SVG loop board ≈ 1.5 min on 2 cores;
  60 s film with many scenes ≈ 10–11 min on a 2-core cloud sandbox.

## TTS Integration (Vietnamese)
- Use VieNeu Studio at http://127.0.0.1:8001 (see `vieneu-tts` skill)
- Split script into shot-length clips, generate per-shot TTS, merge with ffmpeg concat
- Edit `<script id="spec">` in template HTML to match content beats
- See `references/tts-integration.md` for full workflow and timing formula
- **Pitfall**: Convert decimal numbers to words for natural TTS pronunciation ("9.01%" → "9 điểm 01 phần trăm")

## Gotchas that cost real renders
1. Clamp every ramp to 0..1 (an unclamped cubic ramp made a logo scale to −21 000).
2. Never write tiny floats into CSS/SVG: `1e-7px` is silently ignored and the old clip/transform sticks. Round everything.
3. Measure text with `width:auto` first; hidden (`display:none`) elements measure 0 — use `visibility:hidden`.
4. Show/hide must restore `display:flex` for flex boxes.
5. z-order can need to change over time (e.g. pill under the iris at the start, over the wall at the end).
6. Wide variable-font axes overflow — size for the widest value reached.
7. For big zooms on images, compute zoomed rects instead of CSS-scaling a parent (keeps them sharp).
8. Loops: last frame must equal frame 0 — land with an eased ramp exactly at DUR (or F+H+R = loop with `VP.cycle`).
9. Music: librosa BPM can be halved/doubled; fit a linear grid; check energy per beat to find the lift/drop.
10. When a reference page is blocked for fetching, read it in a real browser session instead of scraping around it.
11. Illustrations on a flat background: key to alpha with a flood fill from the border only (interior whites like faces
    stay opaque); wipe paper-edge lines at the image borders first.
12. Delivery limits: chat attachments ≤ 30 MB, device commits ≤ 20 MB/file → 2-pass x264 at ~2.3–3.4 Mb/s for a 60 s 1080p
    master copy to send; keep the high-bitrate master in the project folder.
13. A page with its own rAF loop (live preview) fights `seek()` in screenshots — disable it for rendering
    (`navigator.webdriver` or a `?render` flag).
14. Layouts designed for wide tiles look empty in 1:1 — make sizes/amplitudes depend on the tile's w/h, then re-check.
15. Scene hand-off: the outgoing scene must stay visible until the incoming push/rise/zoom has covered the frame
    (outgoing `end = next.start + ~2.6 beats`), otherwise a blank background flashes and popcheck flags every transition.
16. Never start two renders to the same output (e.g. a chained command that half-ran plus a retry): both write the
    chunks and the final mp4 → corrupt file. Check `ps` first; one `nohup` render, then poll its log.
17. Cloud sandboxes ship a fixed Chromium (`/opt/pw-browsers`); pin the playwright npm version that matches it instead
    of running `playwright install`. Emoji and rare glyphs (✓ ★ ●) may be missing in headless Chromium — draw them as SVG.
18. A background / chunked render can exit 0 having written only PART of the chunks (no final mp4) on Windows — the
    "completed normally (exit code 0)" notification is NOT proof of a finished film. After every render verify BOTH:
    the output file exists AND the chunk count in `out/<film>/.render-<name>/` equals the total. If partial, just re-run
    the SAME command (the chunked renderer resumes); on Windows a synchronous `execute_code`/`subprocess.run([...],
    cwd=repo, timeout=900)` is more reliable here than a fire-and-forget background process.

## Iterating with the user
When a result is close, fix ONE named defect per round and keep motion, timing and loop exactly as they are; say what
changed. Rewriting motion that already works is the most common way to lose a good cut.

## Page contract (every film/template)
`window.seek(t)` (pure), `window.DUR`, `window.ready` (Promise: fonts + images loaded), `window.SIZE=[w,h]`,
`window.B` (seconds per beat), `window.CUES()` → `[{beat, type, gain}]` for the SFX mixer.

## Minimal engine (if the repo isn't available)
```js
const VP={};VP.clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));VP.lerp=(a,b,t)=>a+(b-a)*t;
VP.ease=t=>{t=VP.clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};VP.eOutQuint=t=>1-Math.pow(1-VP.clamp(t),5);
VP.spring=(t,f=2.2,z=.72)=>{if(t<=0)return 0;const w=2*Math.PI*f,wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*t)*(Math.cos(wd*t)+z*w/wd*Math.sin(wd*t))};
let B=.5,bt=0;VP.clock=bpm=>(B=60/bpm);VP.at=t=>(bt=t/B);
VP.sp=(b0,f,z)=>VP.spring((bt-b0)*B,f,z);VP.ramp=(b0,b1,fn=VP.ease)=>fn(VP.clamp((bt-b0)/(b1-b0)));
VP.track=keys=>{const arr=Array.isArray(keys[0][1]);let v=arr?keys[0][1].slice():keys[0][1];
 for(let i=1;i<keys.length;i++){const[b0,val,f=2.2,z=.72]=keys[i];if(bt<=b0)break;const s=VP.sp(b0,f,z),p=keys[i-1][1];
  if(arr)for(let j=0;j<v.length;j++)v[j]+=(val[j]-p[j])*s;else v+=(val-p)*s}return v};
VP.place=(el,r)=>{const s=el.style;s.left=r[0].toFixed(2)+'px';s.top=r[1].toFixed(2)+'px';s.width=Math.max(0,r[2]).toFixed(2)+'px';s.height=Math.max(0,r[3]).toFixed(2)+'px';if(r[4]!=null)s.borderRadius=Math.max(0,r[4]).toFixed(2)+'px'};
VP.roll=(inner,k,h)=>{const y=k<=1?(1-k)*h*1.08:-(k-1)*h*1.08;inner.style.transform=`translateY(${y.toFixed(2)}px)`};
VP.camera=(el,z,fx,fy)=>{el.style.transformOrigin='0 0';el.style.transform=`translate(${(fx-fx*z).toFixed(2)}px,${(fy-fy*z).toFixed(2)}px) scale(${z.toFixed(4)})`};
VP.cycle=(t,{F=2.2,H=4.4,R=1.4,loop=8,offset=0}={})=>{const L=(((t-offset)%loop)+loop)%loop;
 if(L<F)return{phase:'fwd',p:VP.ease(L/F),T:L,h:0,ret:0};if(L<F+H)return{phase:'hold',p:1,T:L,h:(L-F)/H,ret:0};
 if(L<F+H+R){const r=(L-F-H)/R;return{phase:'ret',p:1-VP.ease(r),T:F+H,h:1,ret:r}}return{phase:'before',p:0,T:0,h:0,ret:0}};
VP.rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
VP.gauss=(x,c,s)=>Math.exp(-(((x-c)/s)**2));
```

## Minimal renderer (if the repo isn't available)
Playwright page at SIZE → for i in 0..DUR·fps·sub: `await page.evaluate(t=>seek(t), i/(fps*sub))`, CDP
`Page.captureScreenshot {format:'jpeg',quality:92,optimizeForSpeed:true}` → pipe to
`ffmpeg -f image2pipe -framerate fps*sub -c:v mjpeg -i - -c:v libx264 -crf 8 chunk.mp4`; split frames across one
worker per core; concat; `-vf "tmix=frames=2,select='not(mod(n+1\,2))',setpts=N/60/TB" -r 60 -crf 16`; mux audio
(`loudnorm=I=-14:TP=-1.5`). Then check single-frame spikes in mean abs frame difference (pop check).

## Verification before saying "done"
Checklist reported (all ✅ or explained) · intake answers honoured (mode · format(s) · language · VO · length ±) ·
VO intelligible and in sync (if any; visuals anchored to real word timestamps) · `audit.mjs` 0 errors (warnings explained) ·
data films: `checkdata.mjs` passes · motion judged against `references/timing-easing.md` · critic pass done (no open P0/P1) ·
CTA end shot has the click interaction (or the user chose a question/lockup ending) · Contact sheet reviewed · preview watched ·
0 pops (hard cuts on purpose excepted) · ≈ −14 LUFS · loop seam ≈ 0 if it loops · size under the delivery limit ·
HTML still plays live (Space pause, ←/→ one beat) · illustrative data and licence caveats stated · model notice given ·
for loops/social: reads when paused (poster frame) and every word fits at every frame.