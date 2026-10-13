# Windows Setup Notes

When working with premium-motion-video on Windows, special care is needed for:

## Installation

The repo must be installed via GitHub clone (not npm) because it contains custom JS/Python tools:

```bash
git clone https://github.com/phanminhtuandalat/premium-saas-video-motion.git
```

Default location on this machine: `C:/Users/PHANMINHTUAN/Documents/Videomotion/premium-saas-video-motion`

## Hermes Skill Link

Link the skill into Hermes skills directory:

```python
import os, shutil
skill_src = 'C:/Users/PHANMINHTUAN/Documents/Videomotion/premium-saas-video-motion/skills/premium-motion-video'
skill_dest = 'C:/Users/PHANMINHTUAN/.hermes/skills/premium-motion-video'
os.makedirs(os.path.dirname(skill_dest), exist_ok=True)
if os.path.exists(skill_dest): shutil.rmtree(skill_dest, ignore_errors=True)
os.symlink(skill_src, skill_dest)
```

## Python Dependencies

Required packages for tools (beatgrid.py, mix.py, popcheck.py):

```bash
pip install librosa soundfile numpy
```

Install via Hermes kernel's Python (system pip may timeout on large wheels):

```python
import subprocess, sys
subprocess.run([sys.executable, '-m', 'pip', 'install', 'librosa', 'soundfile', 'numpy'], timeout=180)
```

## Template Modification

To modify the kinetic-promo template:
1. Read `templates/kinetic-promo/index.html`
2. Find the `<script id="spec" type="application/json">` block
3. Replace with new JSON spec (same structure, different shots)
4. Save as new file (e.g., `index-9m2026.html`) to avoid overwriting original

## Render Command

```bash
cd <repo_root>
node tools/render.mjs templates/kinetic-promo/index-9m2026.html --mode final --audio audio/tts_merged.wav --out out/film.mp4
```

Preview first (faster), then final render:
- Preview: `--mode preview` (half size, 30fps, ~30-60s for 30s film)
- Final: `--mode final` (full size, 60fps, 2 sub-frames blur)

## Common Pitfalls

1. **rclone upload timeout**: Google Drive API may be slow; add timeout=60s minimum
2. **TTS path in script**: When splitting Vietnamese text for TTS, convert decimal numbers to words ("9.01%" → "9 điểm 01 phần trăm") for natural pronunciation
3. **Windows line endings**: Template files use CRLF; ensure UTF-8 encoding when editing
4. **node.exe timeout**: Long renders (80s+) will timeout if run as foreground command; use background=True
5. **ffmpeg concat on Windows**: Use `--safe 0` flag when creating concat list for WAV files with spaces in paths

## rclone Google Drive Upload

After render completes:
```bash
rclone copy <video.mp4> gdrive:ZEROM/videos/
rclone link gdrive:ZEROM/videos/<video.mp4>
```

Note: rclone link may timeout on large files; consider manual upload via browser if needed.