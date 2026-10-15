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
ffmpeg -y -v error -i output/scene_01.mp4 -i output/scene_02.mp4 -filter_complex "[0:v]$F[a];[1:v]$F[b];[a][b]concat=n=2:v=1:a=0,ass=input/captions.ass[v]" -map "[v]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart output/mia_nutriflow_whiteboard.mp4
echo BUILD_DONE
