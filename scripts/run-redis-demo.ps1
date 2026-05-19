[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mjsPath = Join-Path $scriptDir 'run-redis-demo.mjs'

function Get-NodeExecutable {
  $command = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($command -and $command.Source) {
    return $command.Source
  }

  $wingetRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
  if (Test-Path -LiteralPath $wingetRoot) {
    $match = Get-ChildItem -LiteralPath $wingetRoot -Recurse -Filter node.exe -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1

    if ($match) {
      return $match.FullName
    }
  }

  throw 'node.exe was not found. Install Node.js 18+ first.'
}

$nodeExe = Get-NodeExecutable
& $nodeExe $mjsPath
exit $LASTEXITCODE
