# 重新渲染讲义里的两张图（用系统自带 Edge 无头模式截图，不依赖 Python 包）
# 用法: pwsh -File tools\render-figs.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$edge = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edge) { throw "找不到 Edge / Chrome，无法截图。请手动打开 tools\figs\*.html 截图 1920x1080。" }

$assets = Join-Path $root "docs\assets"
New-Item -ItemType Directory -Force -Path $assets | Out-Null

$map = @{
  "fig1" = "图1-计算谱系.png"
  "fig2" = "图2-端云协同.png"
}

foreach ($k in $map.Keys) {
  $html = Join-Path $root "tools\figs\$k.html"
  $out  = Join-Path $assets $map[$k]
  $uri  = "file:///" + ($html -replace '\\', '/')
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
          --window-size=1920,1080 --screenshot="$out" $uri 2>$null | Out-Null
  Write-Host "rendered -> $out"
}
