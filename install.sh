#!/bin/sh
# Installs the session-hud mod into ~/.claude/skills and checks the desktop-app setting.
set -e

here=$(cd "$(dirname "$0")" && pwd)
skills="$HOME/.claude/skills"
mkdir -p "$skills"

for mod in session-hud; do
  rm -rf "$skills/$mod"
  cp -R "$here/$mod" "$skills/$mod"
  echo "Installed $mod -> $skills/$mod"
done

# Before 2.0 the context meter was a mod of its own; with both, it shows twice
if [ -d "$skills/context-meter" ]; then
  printf '\nFound the old context-meter mod. session-hud includes it now: delete %s so it does not show twice.\n' "$skills/context-meter"
fi

settings="$HOME/.claude/settings.json"
if [ -f "$settings" ] && grep -q '"CLAUDE_CODE_PLUGIN_DIR_WATCH"' "$settings"; then
  printf '\nsettings.json already has CLAUDE_CODE_PLUGIN_DIR_WATCH.\n'
else
  printf '\nUsing the desktop app? Add this line to the "env" block of %s :\n' "$settings"
  echo '    "CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"'
  echo 'See README.md, step 2.'
fi
printf '\nDone. Open a NEW Claude Code session to see the HUD.\n'
