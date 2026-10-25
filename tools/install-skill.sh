#!/usr/bin/env bash
# Link the skills into every agent's global skills folder (Claude Code, Codex/Gemini/Copilot via ~/.agents).
# macOS/Linux: symlink. Windows (Git Bash): directory junction (no admin rights needed; plain symlinks often fail there).
# A real folder that is already there (a copy, e.g. made by hand) is left alone and reported: delete it yourself to switch to a link.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WIN=1 ;; *) WIN=0 ;; esac

link() {  # link <source dir> <destination path>
  local src="$1" dst="$2"
  if [ -L "$dst" ]; then
    if [ "$WIN" = 1 ]; then cmd.exe //c rmdir "$(cygpath -w "$dst")" >/dev/null; else rm "$dst"; fi
  elif [ -e "$dst" ]; then
    echo "skip (real folder, not a link) → $dst"; return
  fi
  if [ "$WIN" = 1 ]; then
    cmd.exe //c mklink //J "$(cygpath -w "$dst")" "$(cygpath -w "$src")" >/dev/null
  else
    ln -sfn "$src" "$dst"
  fi
  echo "linked → $dst"
}

for S in premium-motion-video anatomy lemo-opuscar; do
  for D in "$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.codex/skills"; do
    mkdir -p "$D"; link "$ROOT/skills/$S" "$D/$S"
  done
done
echo "Superpowers (recommended): Claude Code → /plugin install superpowers@claude-plugins-official ; others → https://github.com/obra/superpowers#installation"
