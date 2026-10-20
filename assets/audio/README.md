# Embedded audio library

Ships with the repo so the pipeline works offline after download.

- `music/` — 7 background tracks, renamed by mood. BPM, beat offset, drop guess, breakdowns and energy per bar are
  pre-computed in `library.json` (from `tools/beatgrid.py`), so an agent can pick a track and plan splices without re-analysing.
- `sfx/` — 40 short effects (`category__name.wav`): transitions, tech UI, cinematic hits, retro pops, game.
- `sfx.json` — default cue-type → file map used by `tools/mix.py` (paths relative to this folder).

Pick a track: match `mood` / `good_for` to the brand playbook, then check `energy_db_per_bar` for the lift (≈ +3 dB)
and the drop; put the logo on the lift and the hero moment on the drop.

Licences: tracks come from Pixabay / chosic.com free libraries — Pixabay tracks are free for commercial use;
chosic.com tracks may require attribution. Check `licence` in `library.json` and the source page before paid ads.
Replace or add tracks freely: drop a file in `music/`, run `python3 tools/beatgrid.py music/<file>` and add an entry.

## `sfx-drive/` — extra pack from a shared Drive folder (local only, not in git)

1,298 effects (≈1 GB, git-ignored): `Anime SFX`, `Mister Horse Free SFX`, `QUẠ BASIC`, `SFX NHẬT BẢN`, `SUSPEND ALERT`.
`sfx-drive/INDEX.json` lists pack / folder / name / file / duration for searching, e.g. `grep -i whoosh assets/audio/sfx-drive/INDEX.json`.
Re-download: `node tools/fetch-drive-folder.mjs 1L4WOlQINxD45bRTikaUmV6QZ362P41rh assets/audio/sfx-drive`, re-index: `node tools/index-sfx.mjs assets/audio/sfx-drive`.
Use a file as a cue by pointing a key in `sfx.json` at `sfx-drive/<file>`. Licences differ per pack (Mister Horse free pack, meme and game clips in the others) — check before paid ads.
