param(
    [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = (Get-Command python -ErrorAction Stop).Source

Set-Location -LiteralPath $projectRoot
Write-Host "Game server: http://127.0.0.1:$Port/"
Write-Host 'Press Ctrl+C to stop.'
& $python -m http.server $Port --bind 127.0.0.1
