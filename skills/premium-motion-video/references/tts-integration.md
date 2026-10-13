# TTS Integration with Premium Motion Video

Use VieNeu Studio (http://127.0.0.1:8001) for Vietnamese voice-over in motion videos.

## Workflow

1. **Split script into shot-length clips** (one sentence per shot, 3-8s each)
2. **Generate TTS** for each clip with appropriate voice
3. **Merge clips** with ffmpeg concat
4. **Render video** with `--audio merged.wav`

## Example: Economic Data Video (9m2026)

```python
# Split script into shot clips
shots = [
    ("GDP thực tăng 9 điểm 01 phần trăm.", "gdp"),
    ("Công nghiệp và xây dựng tăng 11 phần trăm 21.", "industry"),
]

# Generate TTS per shot
for text, name in shots:
    data = json.dumps({"text": text, "voice": "Mai Anh", "speed": 1.0}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8001/api/tts', data=data,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        with open(f'{outdir}/{name}.wav', 'wb') as f:
            f.write(r.read())

# Merge with ffmpeg
concat_file = f'{outdir}/concat.txt'
with open(concat_file, 'w') as f:
    for clip in clips:
        f.write(f"file '{os.path.abspath(os.path.join(outdir, clip))}'\n")
subprocess.run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', concat_file,
                '-c:a', 'pcm_s16le', f'{outdir}/tts_merged.wav'])

# Render video
subprocess.run(['node', 'tools/render.mjs', template, '--mode', 'final',
                '--audio', f'{outdir}/tts_merged.wav', '--out', f'{outdir}/video.mp4'])
```

## Template Modification

Edit only the `<script id="spec">` block in template HTML:
- `size`: `[1080, 1920]` for 9:16, `[1920, 1080]` for 16:9
- `bpm`: Set to match narration speed (~120 for energetic, ~90-100 for calm)
- Each shot duration = `beats * (60/bpm)` seconds
- Total duration = `sum(beats) * (60/bpm)`

## Timing Formula

```
Duration per shot (seconds) = beats * (60 / bpm)
Total duration = sum(all beats) * (60 / bpm)
```

Example: 12 shots × 4 beats, bpm=120 → 48 beats × 0.5s = 24s (too short)
Add longer shots or reduce BPM for slower pacing.

## Voice Selection for Content Type

| Content | Recommended Voice | Reason |
|---------|-------------------|--------|
| Economic data, news | `Mai Anh` | Female, news style, clear articulation |
| Narrative/story | `Thiện Minh` | Male, storytelling tone |
| Natural conversation | `Trúc Ly` | Female, natural, friendly |

## Speed Adjustment

- Default speed=1.0 for most content
- Speed up (1.1-1.2) for rapid-fire numbers/data
- Slow down (0.8-0.9) for important messages/CTA

## Pitfall: Audio Length vs Video Duration

- TTS duration may differ from planned beat count
- If TTS is too long, reduce text or increase speed
- If too short, add breath pauses or repeat key numbers
- Always check total audio length before rendering