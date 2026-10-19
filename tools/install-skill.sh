#!/usr/bin/env bash
# Link the skills into every agent's global skills folder (Claude Code, Codex/Gemini/Copilot via ~/.agents).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for S in premium-motion-video anatomy lemo-opuscar; do
  for D in "$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.codex/skills"; do
    mkdir -p "$D"; ln -sfn "$ROOT/skills/$S" "$D/$S"; echo "linked → $D/$S"
  done
done
echo "Superpowers (recommended): Claude Code → /plugin install superpowers@claude-plugins-official ; others → https://github.com/obra/superpowers#installation"
