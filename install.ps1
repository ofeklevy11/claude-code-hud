# Installs the session-hud mod into ~/.claude/skills and checks the desktop-app setting.
$ErrorActionPreference = 'Stop'

$skills = Join-Path $HOME '.claude\skills'
New-Item -ItemType Directory -Force $skills | Out-Null

foreach ($mod in @('session-hud')) {
    $src = Join-Path $PSScriptRoot $mod
    $dst = Join-Path $skills $mod
    if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    Copy-Item -Recurse $src $dst
    Write-Host "Installed $mod -> $dst"
}

# Before 2.0 the context meter was a mod of its own; with both, it shows twice
if (Test-Path (Join-Path $skills 'context-meter')) {
    Write-Host "`nFound the old context-meter mod. session-hud includes it now: delete $(Join-Path $skills 'context-meter') so it does not show twice."
}

$settings = Join-Path $HOME '.claude\settings.json'
$hasWatch = (Test-Path $settings) -and ((Get-Content -Raw $settings) -match '"CLAUDE_CODE_PLUGIN_DIR_WATCH"')
if ($hasWatch) {
    Write-Host "`nsettings.json already has CLAUDE_CODE_PLUGIN_DIR_WATCH."
} else {
    Write-Host "`nUsing the desktop app? Add this line to the `"env`" block of $settings :"
    Write-Host '    "CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"'
    Write-Host 'See README.md, step 2.'
}
Write-Host "`nDone. Open a NEW Claude Code session to see the HUD."
