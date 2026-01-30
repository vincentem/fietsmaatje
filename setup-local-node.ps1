# Local Node.js setup for PowerShell
# This script sets up PATH to use portable Node.js

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommandPath
$NodePath = Join-Path $ScriptDir "node_portable"

# Add to PATH
$env:PATH = "$NodePath;$env:PATH"

Write-Host "✅ Local Node.js activated!" -ForegroundColor Green
Write-Host "Node: $(& $NodePath\node.exe --version)"
Write-Host "npm: $(& $NodePath\npm.cmd --version)"
Write-Host ""
Write-Host "You can now use:" -ForegroundColor Cyan
Write-Host "  node --version"
Write-Host "  npm install"
Write-Host "  npm run dev"
