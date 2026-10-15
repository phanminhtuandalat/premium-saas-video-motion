#!/usr/bin/env bash
# Renders both whiteboard scenes with the skill's stream renderer (text-free hand sprite), then merges and burns captions.
set -e
cd "$(dirname "$0")"
export PYTHONUTF8=1
SK="$HOME/.claude/skills/srt-whiteboard-animation"
PY="$SK/.venv/Scripts/python.exe"
node make-annotations.mjs && node make-subs.mjs
for n in 01 02; do
  "$PY" "$SK/scripts/render_stream_whiteboard.py" scene_$n.png scene_$n.annotation.json output/scene_$n.mp4 hand-clean.png --cap-long-edge 1920 > output/r$n.log 2>&1 &
done
wait
F="scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xF5EBD7,setsar=1,fps=60"
# Voice + music: node audio/gen-vo.mjs (needs VieNeu on :8001), then place audio/c1..c8.wav at the SRT cue starts and mix
# with out/mia-music.wav (tools/synthmusic.py --bpm 80 --beats 80 --mood minimal) into out/mia-mix.wav (-14 LUFS, ducked).
AUDIO=../../out/mia-mix.wav
if [ -f "$AUDIO" ]; then
  ffmpeg -y -v error -i output/scene_01.mp4 -i output/scene_02.mp4 -i "$AUDIO" -filter_complex "[0:v]$F,fade=t=out:st=29.65:d=0.35:color=0xF5EBD7[a];[1:v]$F,fade=t=in:st=0:d=0.35:color=0xF5EBD7[b];[a][b]concat=n=2:v=1:a=0,ass=input/captions.ass,tpad=stop_mode=clone:stop_duration=2[v]" -map "[v]" -map 2:a -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -profile:a aac_low -ar 44100 -ac 2 -b:a 192k -movflags +faststart -t 62 output/mia_nutriflow_whiteboard_voice.mp4
fi
ffmpeg -y -v error -i output/scene_01.mp4 -i output/scene_02.mp4 -filter_complex "[0:v]$F[a];[1:v]$F[b];[a][b]concat=n=2:v=1:a=0,ass=input/captions.ass[v]" -map "[v]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart output/mia_nutriflow_whiteboard.mp4
echo BUILD_DONE
