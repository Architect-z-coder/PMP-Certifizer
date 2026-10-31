#Requires -Version 5.1
<#
.SYNOPSIS
  Sets up Blender MCP, Meshy MCP, the Meshy skill pack and Spline for Claude Code
  and the Claude desktop app on Windows.

.DESCRIPTION
  Runs seven steps in order and checks each one before moving on. It asks before
  every install, says which ones need admin rights, and asks before anything it
  cannot verify. It never prints the full Meshy key. It ends with a status table.

  Run it from a normal PowerShell window, not an admin one:
      powershell -ExecutionPolicy Bypass -File .\setup-3d-toolchain.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$AddonUrl = 'https://raw.githubusercontent.com/ahujasid/blender-mcp/main/addon.py'
$AddonModule = 'blender_mcp'
$SplineDownloadUrl = 'https://spline.design/download'
$SplineHostedUrl = 'https://mcp.spline.design/mcp'
$MinNode = [version]'22.12.0'
$Utf8 = New-Object System.Text.UTF8Encoding $false

# ---------------------------------------------------------------- report ---
$Rows = [ordered]@{}
foreach ($tool in @('Node.js', 'uv', 'git', 'Blender', 'Blender add-on', 'Blender MCP', 'Meshy MCP', 'Meshy skill pack', 'Spline MCP')) {
    $Rows[$tool] = @{ Installed = 'not checked'; Code = 'n/a'; Desktop = 'n/a'; Manual = '' }
}
foreach ($tool in @('Blender MCP', 'Meshy MCP', 'Meshy skill pack', 'Spline MCP')) {
    $Rows[$tool].Code = 'no'
    $Rows[$tool].Desktop = 'no'
}

function Set-Row([string]$Tool, [string]$Field, [string]$Value) { $Rows[$Tool][$Field] = $Value }

function Add-Manual([string]$Tool, [string]$Text) {
    if ($Rows[$Tool].Manual) { $Rows[$Tool].Manual = $Rows[$Tool].Manual + '; ' + $Text }
    else { $Rows[$Tool].Manual = $Text }
}

function Show-Report {
    Write-Host ''
    Write-Host '=== Status' -ForegroundColor Cyan
    $table = foreach ($tool in $Rows.Keys) {
        $r = $Rows[$tool]
        [pscustomobject]@{
            'Tool'                     = $tool
            'Installed'                = $r.Installed
            'Claude Code'              = $r.Code
            'Claude Desktop'           = $r.Desktop
            'Manual step left for you' = $r.Manual
        }
    }
    $table | Format-Table -AutoSize -Wrap | Out-String -Width 240 | Write-Host
}

# --------------------------------------------------------------- helpers ---
function Write-Step([string]$Text) { Write-Host ''; Write-Host "=== $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host "  [ok] $Text" -ForegroundColor Green }
function Write-Note([string]$Text) { Write-Host "  [!] $Text" -ForegroundColor Yellow }

function Confirm-Step([string]$Question) {
    $answer = Read-Host "  $Question [y/N]"
    return ($answer -match '^\s*(y|yes)\s*$')
}

function Stop-Setup([string]$Reason) {
    Write-Host ''
    Write-Host "Stopped: $Reason" -ForegroundColor Red
    Show-Report
    exit 1
}

function Update-SessionPath {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = (@($machine, $user) | Where-Object { $_ }) -join ';'
}

function Find-Exe([string]$Name) {
    $cmd = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd) { return $cmd.Path }
    return $null
}

function Find-FirstFile([string[]]$Candidates) {
    foreach ($candidate in $Candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) { return $candidate }
    }
    return $null
}

function Find-Uvx {
    $found = Find-Exe 'uvx.exe'
    if ($found) { return $found }
    return Find-FirstFile @("$env:USERPROFILE\.local\bin\uvx.exe", "$env:LOCALAPPDATA\Microsoft\WinGet\Links\uvx.exe")
}

function Find-Blender {
    $found = Find-Exe 'blender.exe'
    if ($found) { return $found }
    $hits = @()
    foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if (-not $root) { continue }
        $base = Join-Path $root 'Blender Foundation'
        foreach ($dir in @(Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue)) {
            $exe = Join-Path $dir.FullName 'blender.exe'
            if (Test-Path -LiteralPath $exe) {
                $version = [version]'0.0'
                if ($dir.Name -match '(\d+\.\d+(\.\d+)?)') { $version = [version]$Matches[1] }
                $hits += [pscustomobject]@{ Path = $exe; Version = $version }
            }
        }
    }
    $best = $hits | Sort-Object Version -Descending | Select-Object -First 1
    if ($best) { return $best.Path }
    return $null
}

function Find-Claude {
    $found = Find-Exe 'claude.exe'
    if (-not $found) { $found = Find-Exe 'claude.cmd' }
    if ($found) { return $found }
    return Find-FirstFile @("$env:USERPROFILE\.local\bin\claude.exe")
}

function Get-NodeVersion {
    $node = Find-Exe 'node.exe'
    if (-not $node) { return $null }
    $raw = & $node --version 2>$null
    if ("$raw" -match 'v?(\d+\.\d+\.\d+)') { return [version]$Matches[1] }
    return $null
}

function Install-WithWinget([string]$Id, [string]$Label, [bool]$NeedsAdmin) {
    if (-not $script:Winget) {
        Write-Note "$Label is missing and winget is not available, so it cannot be installed here."
        return $false
    }
    if ($NeedsAdmin) { $note = 'It installs for all users, so Windows will ask for admin rights (UAC).' }
    else { $note = 'It installs for your user only and needs no admin rights.' }
    Write-Host "  Command: winget install -e --id $Id"
    Write-Host "  $note"
    if (-not (Confirm-Step "Install $Label now?")) { return $false }
    & $script:Winget install -e --id $Id --accept-source-agreements --accept-package-agreements
    Write-Host "  winget finished with exit code $LASTEXITCODE."
    Update-SessionPath
    return $true
}

function Write-TextFile([string]$Path, [string]$Text) { [IO.File]::WriteAllText($Path, $Text, $Utf8) }

function Get-ConfigKeys([string]$File) {
    if (-not $script:Node -or -not (Test-Path -LiteralPath $File)) { return @() }
    return @(& $script:Node $script:Helper keys $File)
}

function Get-McpListStatus([string]$Text, [string]$Pattern) {
    foreach ($line in ($Text -split "`r?`n")) {
        if ($line -match "^\s*($Pattern)\s*:") {
            if ($line -match 'Failed') { return 'failed to connect' }
            if ($line -match 'authenticat') { return 'needs sign-in' }
            if ($line -match '\bConnected\b') { return 'connected' }
            return 'listed'
        }
    }
    return $null
}

function Invoke-ClaudeMcpList {
    Write-Host '  Running: claude mcp list'
    Write-Host '  (Its health check starts each server for a moment and then stops it.)'
    $text = & $script:Claude mcp list 2>&1 | Out-String
    Write-Host $text
    return $text
}

# Node helper for the claude CLI calls and JSON edits. Windows PowerShell 5.1 can
# mangle JSON when it rewrites it and when it passes it to native commands.
$HelperSource = @'
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { isDeepStrictEqual } from "node:util";

const MESHY_PACKAGE = "@meshy-ai/meshy-mcp-server";
const CMD_SPECIAL = /[&|<>^%!\r\n]/;

export function quoteWindowsArg(arg) {
  if (CMD_SPECIAL.test(arg)) throw new Error(`cannot pass ${JSON.stringify(arg)} safely through cmd.exe`);
  if (arg !== "" && !/[\s"]/.test(arg)) return arg;
  let out = '"';
  let slashes = 0;
  for (const ch of arg) {
    if (ch === "\\") { slashes += 1; continue; }
    out += ch === '"' ? "\\".repeat(slashes * 2 + 1) + '"' : "\\".repeat(slashes) + ch;
    slashes = 0;
  }
  return out + "\\".repeat(slashes * 2) + '"';
}

function claude(args) {
  const bin = process.env.SETUP_CLAUDE_BIN || "claude";
  if (process.platform === "win32") {
    // claude is often claude.cmd, which Node can only start through cmd.exe.
    return spawnSync([bin, ...args].map(quoteWindowsArg).join(" "), { encoding: "utf8", shell: true });
  }
  return spawnSync(bin, args, { encoding: "utf8" });
}

const output = (r) => `${r.stdout ?? ""}${r.stderr ?? ""}${r.error?.message ?? ""}`.trim();

function registerInClaude(name, addArgs) {
  try {
    let r = claude(addArgs);
    if (r.status !== 0 && /already exists/i.test(output(r))) {
      claude(["mcp", "remove", "-s", "user", name]);
      r = claude(addArgs);
    }
    if (r.status === 0) {
      console.log(`  [ok] Claude Code: ${name} registered at user scope (every project).`);
      return true;
    }
    console.log(`  [!] Claude Code: registering ${name} failed: ${output(r)}`);
  } catch (error) {
    console.log(`  [!] Claude Code: registering ${name} failed: ${error.message}`);
  }
  return false;
}

export function buildServers(uvx, meshyKey) {
  const servers = {};
  if (uvx && uvx !== "-") servers.blender = { command: uvx, args: ["--python", "3.12", "blender-mcp"] };
  if (meshyKey) {
    servers.meshy = { command: "cmd", args: ["/c", "npx", "-y", MESHY_PACKAGE], env: { MESHY_API_KEY: meshyKey } };
  }
  return servers;
}

export function mergeDesktopConfig(text, servers) {
  const source = (text ?? "").replace(/^\uFEFF/, "");
  const config = source.trim() ? JSON.parse(source) : {};
  if (config === null || typeof config !== "object" || Array.isArray(config)) throw new Error("it is not a JSON object");
  const existing = config.mcpServers ?? {};
  if (existing === null || typeof existing !== "object" || Array.isArray(existing)) {
    throw new Error('its "mcpServers" value is not an object');
  }
  config.mcpServers = { ...existing, ...servers };
  return JSON.stringify(config, null, 2) + "\n";
}

function updateDesktop(file, servers) {
  const existed = existsSync(file);
  let next;
  try {
    next = mergeDesktopConfig(existed ? readFileSync(file, "utf8") : "", servers);
  } catch (error) {
    console.log(`  [!] Claude Desktop: left ${file} unchanged because ${error.message}. Fix it and run again.`);
    return false;
  }
  let backup = null;
  if (existed) {
    backup = `${file}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    copyFileSync(file, backup);
    console.log(`  [ok] Backup: ${backup}`);
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, next, "utf8");
  try {
    const written = JSON.parse(readFileSync(file, "utf8"));
    const missing = Object.keys(servers).filter((k) => !isDeepStrictEqual(written.mcpServers?.[k], servers[k]));
    if (missing.length === 0) {
      console.log(`  [ok] Claude Desktop: ${file} is valid JSON and has ${Object.keys(servers).join(" and ")}.`);
      return true;
    }
    console.log(`  [!] Claude Desktop: ${missing.join(", ")} missing from ${file} after writing.`);
  } catch (error) {
    console.log(`  [!] Claude Desktop: ${file} is not valid JSON after writing: ${error.message}`);
  }
  if (backup) {
    copyFileSync(backup, file);
    console.log("  [!] Restored the backup.");
  }
  return false;
}

function printKeys(file) {
  try {
    const config = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    for (const key of Object.keys(config.mcpServers ?? {})) console.log(key);
  } catch {
    // Missing or unreadable files have no keys.
  }
}

const [command, ...rest] = process.argv.slice(2);
let ok = true;
if (command === "register-code") {
  // ${MESHY_API_KEY} is expanded by Claude Code at launch, so the key stays out of ~/.claude.json.
  const servers = buildServers(rest[0], process.env.MESHY_API_KEY ? "${MESHY_API_KEY}" : "");
  for (const [name, config] of Object.entries(servers)) {
    ok = registerInClaude(name, ["mcp", "add-json", "-s", "user", name, JSON.stringify(config)]) && ok;
  }
} else if (command === "register-desktop") {
  const [uvx, ...files] = rest;
  const servers = buildServers(uvx, process.env.MESHY_API_KEY ?? "");
  for (const file of files) ok = updateDesktop(file, servers) && ok;
} else if (command === "add-http") {
  const [name, url] = rest;
  ok = registerInClaude(name, ["mcp", "add", "--transport", "http", "-s", "user", name, url]);
} else if (command === "keys") {
  printKeys(rest[0]);
} else if (command !== undefined) {
  console.log(`  [!] Unknown helper command: ${command}`);
  ok = false;
}
process.exitCode = ok ? 0 : 1;
'@

# ------------------------------------------------------------- 0. sanity ---
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Note 'This window runs as administrator. Per-user settings can land in the wrong profile.'
    if (-not (Confirm-Step 'Continue anyway? A normal PowerShell window is recommended.')) { exit 1 }
}
Update-SessionPath

# ------------------------------------------------------ 1. prerequisites ---
Write-Step '1. Prerequisites'
$Winget = Find-Exe 'winget.exe'
if ($Winget) { Write-Ok "winget: $Winget" }
else { Write-Note 'winget was not found. Install "App Installer" from the Microsoft Store to get it.' }

$nodeVersion = Get-NodeVersion
if (-not $nodeVersion -or $nodeVersion -lt $MinNode) {
    if ($nodeVersion) { Write-Note "Node.js $nodeVersion is older than $MinNode, which the Meshy skill pack needs." }
    else { Write-Note 'Node.js is not installed.' }
    $null = Install-WithWinget 'OpenJS.NodeJS.LTS' 'Node.js LTS' $true
    $nodeVersion = Get-NodeVersion
}
$Node = Find-Exe 'node.exe'
if ($nodeVersion) {
    Set-Row 'Node.js' Installed "yes ($nodeVersion)"
    if ($nodeVersion -lt $MinNode) { Add-Manual 'Node.js' "Upgrade to $MinNode or newer" }
    Write-Ok "Node.js $nodeVersion at $Node"
} else {
    Set-Row 'Node.js' Installed 'no'
    Add-Manual 'Node.js' 'Install Node.js LTS'
}

$Uvx = Find-Uvx
if (-not $Uvx) {
    Write-Note 'uv is not installed.'
    $null = Install-WithWinget 'astral-sh.uv' 'uv' $false
    $Uvx = Find-Uvx
}
if ($Uvx) { Set-Row 'uv' Installed 'yes'; Write-Ok "uv found" }
else { Set-Row 'uv' Installed 'no'; Add-Manual 'uv' 'Install uv' }

$Git = Find-Exe 'git.exe'
if (-not $Git) {
    Write-Note 'git is not installed.'
    $null = Install-WithWinget 'Git.Git' 'Git' $true
    $Git = Find-Exe 'git.exe'
}
if ($Git) { Set-Row 'git' Installed 'yes'; Write-Ok "git at $Git" }
else { Set-Row 'git' Installed 'no'; Add-Manual 'git' 'Install Git' }

$Blender = Find-Blender
if (-not $Blender) {
    Write-Note 'Blender is not installed.'
    $null = Install-WithWinget 'BlenderFoundation.Blender' 'Blender' $true
    $Blender = Find-Blender
}
if ($Blender) { Set-Row 'Blender' Installed 'yes'; Write-Ok 'Blender found' }
else { Set-Row 'Blender' Installed 'no'; Add-Manual 'Blender' 'Install Blender' }

Write-Host ''
Write-Host '  Full paths:'
if ($Uvx) { Write-Host "    uvx.exe:     $Uvx" } else { Write-Host '    uvx.exe:     not found' }
if ($Blender) { Write-Host "    blender.exe: $Blender" } else { Write-Host '    blender.exe: not found' }

if (-not $Node) { Stop-Setup 'Node.js is required for the remaining steps.' }
$Helper = Join-Path $env:TEMP 'claude-3d-setup-helper.mjs'
Write-TextFile $Helper $HelperSource

# ------------------------------------------------------ 2. Blender add-on ---
Write-Step '2. Blender add-on'
$addonReady = $false
if (-not $Blender) {
    Set-Row 'Blender add-on' Installed 'no'
    Add-Manual 'Blender add-on' 'Install Blender, then run this script again'
} else {
    $skipAddon = $false
    while (-not $skipAddon -and (Get-Process -Name 'blender' -ErrorAction SilentlyContinue)) {
        Write-Note 'Blender is open. Close it first, or it can overwrite the saved preferences when it exits.'
        $answer = Read-Host '  Press Enter after closing Blender, or type skip'
        if ($answer -match '^\s*skip\s*$') { $skipAddon = $true }
    }
    $addonFile = Join-Path $env:TEMP "$AddonModule.py"
    $downloaded = $false
    if (-not $skipAddon) {
        try {
            Invoke-WebRequest -Uri $AddonUrl -OutFile $addonFile -UseBasicParsing -ErrorAction Stop
            $downloaded = $true
        } catch {
            Write-Note "Download failed: $($_.Exception.Message)"
        }
    }
    if ($downloaded) {
        $text = [IO.File]::ReadAllText($addonFile)
        $protocol = $null
        if ($text -match 'ADDON_PROTOCOL_VERSION\s*=\s*(\d+)') { $protocol = $Matches[1] }
        $addonVersion = $null
        if ($text -match '"version":\s*\((\d+),\s*(\d+)') { $addonVersion = "$($Matches[1]).$($Matches[2])" }
        if (($text -match '"name":\s*"MCP for Blender"') -and $protocol) {
            Write-Ok "Downloaded add-on version $addonVersion (protocol $protocol), $((Get-Item -LiteralPath $addonFile).Length) bytes."
        } else {
            Write-Note 'The downloaded file does not look like the MCP for Blender add-on, so it was not installed.'
            $downloaded = $false
        }
    }
    if ($downloaded) {
        $installPy = Join-Path $env:TEMP 'blender_mcp_install.py'
        $verifyPy = Join-Path $env:TEMP 'blender_mcp_verify.py'
        Write-TextFile $installPy @'
import os
import addon_utils
import bpy

path = os.environ["SETUP_ADDON_FILE"]
module = os.environ["SETUP_ADDON_MODULE"]
names = {"MCP for Blender", "Blender MCP"}
for mod in addon_utils.modules(refresh=True):
    info = getattr(mod, "bl_info", None) or {}
    if info.get("name") in names and mod.__name__ != module and mod.__name__ in bpy.context.preferences.addons:
        bpy.ops.preferences.addon_disable(module=mod.__name__)
        print("SETUP_ADDON_DISABLED=" + mod.__name__)
if "FINISHED" not in bpy.ops.preferences.addon_install(filepath=path, overwrite=True):
    raise RuntimeError("addon_install did not finish")
if "FINISHED" not in bpy.ops.preferences.addon_enable(module=module):
    raise RuntimeError("addon_enable did not finish")
bpy.ops.wm.save_userpref()
print("SETUP_ADDON_INSTALLED")
'@
        Write-TextFile $verifyPy @'
import os
import addon_utils
import bpy

module = os.environ["SETUP_ADDON_MODULE"]
print("SETUP_ADDON_ENABLED=" + ("1" if module in bpy.context.preferences.addons else "0"))
others = []
for mod in addon_utils.modules(refresh=True):
    info = getattr(mod, "bl_info", None) or {}
    if info.get("name") in {"MCP for Blender", "Blender MCP"} and mod.__name__ != module:
        others.append(mod.__name__)
print("SETUP_ADDON_OTHERS=" + ",".join(others))
'@
        $env:SETUP_ADDON_FILE = $addonFile
        $env:SETUP_ADDON_MODULE = $AddonModule
        Write-Host '  Installing and enabling the add-on with Blender in background mode...'
        $installOut = & $Blender -b --python-exit-code 1 --python $installPy 2>&1 | Out-String
        $installCode = $LASTEXITCODE
        Write-Host '  Checking the saved preferences in a second background run...'
        $verifyOut = & $Blender -b --python-exit-code 1 --python $verifyPy 2>&1 | Out-String
        if ($verifyOut -match 'SETUP_ADDON_ENABLED=1') {
            $addonReady = $true
            Set-Row 'Blender add-on' Installed 'yes, enabled'
            Write-Ok "MCP for Blender is installed as '$AddonModule' and enabled in saved preferences."
            foreach ($m in [regex]::Matches($installOut, 'SETUP_ADDON_DISABLED=(\S+)')) {
                Write-Note "Switched off an older copy of the add-on: $($m.Groups[1].Value)"
            }
            if ($verifyOut -match 'SETUP_ADDON_OTHERS=(\S+)') {
                Write-Note "Other copies are still installed: $($Matches[1]). Remove them in Edit > Preferences > Add-ons."
                Add-Manual 'Blender add-on' "Remove the old copy ($($Matches[1]))"
            }
        } else {
            Set-Row 'Blender add-on' Installed 'no'
            Add-Manual 'Blender add-on' 'Install addon.py from Edit > Preferences > Add-ons'
            Write-Note "The add-on is not enabled (install exit code $installCode). Blender output:"
            Write-Host $installOut
        }
    } else {
        Set-Row 'Blender add-on' Installed 'no'
        if ($skipAddon) { Add-Manual 'Blender add-on' 'Close Blender and run this script again' }
        else { Add-Manual 'Blender add-on' 'Download failed; check the connection and run this script again' }
    }
}

# ---------------------------------------------------------------- 3. Meshy ---
Write-Step '3. Meshy key and skill pack'
$MeshyKey = [Environment]::GetEnvironmentVariable('MESHY_API_KEY', 'User')
if (-not $MeshyKey) {
    Write-Note 'MESHY_API_KEY is not set in your user environment variables.'
    $secure = Read-Host '  Paste your Meshy API key to save it there (typing is hidden), or press Enter to stop' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $entered = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if (-not $entered -or -not $entered.Trim()) {
        Stop-Setup 'MESHY_API_KEY is missing. Get a key at https://www.meshy.ai/developers/keys, then run this again.'
    }
    $MeshyKey = $entered.Trim()
    [Environment]::SetEnvironmentVariable('MESHY_API_KEY', $MeshyKey, 'User')
    Write-Ok 'Saved MESHY_API_KEY to your user environment variables.'
}
$MeshyKey = $MeshyKey.Trim()
if ($MeshyKey.Length -ge 4) { $tail = $MeshyKey.Substring($MeshyKey.Length - 4) } else { $tail = '????' }
Write-Ok "MESHY_API_KEY found, ending in ...$tail"
if ($MeshyKey -notmatch '^msy_[A-Za-z0-9_-]+$') {
    Write-Note 'The key does not look like a Meshy key, which starts with msy_.'
    if (-not (Confirm-Step 'Use it anyway?')) { Stop-Setup 'Fix MESHY_API_KEY, then run this again.' }
}
$env:MESHY_API_KEY = $MeshyKey

$meshyKeyOk = $false
try {
    $balance = Invoke-RestMethod -Uri 'https://api.meshy.ai/openapi/v1/balance' -Headers @{ Authorization = "Bearer $MeshyKey" } -UseBasicParsing -ErrorAction Stop
    $meshyKeyOk = $true
    Write-Ok "Meshy accepted the key (free balance check): $($balance | ConvertTo-Json -Compress)"
} catch {
    $httpStatus = 'no response'
    if ($_.Exception.Response) { $httpStatus = "HTTP $([int]$_.Exception.Response.StatusCode)" }
    Write-Note "Meshy did not accept the key ($httpStatus)."
    if (-not (Confirm-Step 'Register Meshy anyway?')) { Stop-Setup 'Check MESHY_API_KEY, then run this again.' }
}
if ($meshyKeyOk) { Set-Row 'Meshy MCP' Installed 'yes, key works' }
else { Set-Row 'Meshy MCP' Installed 'key not confirmed'; Add-Manual 'Meshy MCP' 'Check MESHY_API_KEY' }

$Npx = Find-Exe 'npx.cmd'
$skillsDir = Join-Path $HOME '.claude\skills'
if ($nodeVersion -lt $MinNode) {
    Write-Note "The skill pack needs Node.js $MinNode or newer, so it was skipped."
    Set-Row 'Meshy skill pack' Installed 'no'
    Add-Manual 'Meshy skill pack' "Upgrade Node.js to $MinNode+, then run this again"
} elseif (-not $Npx) {
    Write-Note 'npx was not found, so the skill pack was skipped.'
    Set-Row 'Meshy skill pack' Installed 'no'
    Add-Manual 'Meshy skill pack' 'Reinstall Node.js LTS'
} else {
    Write-Host '  Running: npx -y skills add meshy-dev/meshy-3d-agent --skill meshy-3d-generation --skill meshy-3d-printing -g -a claude-code -y'
    & $Npx -y skills add meshy-dev/meshy-3d-agent --skill meshy-3d-generation --skill meshy-3d-printing -g -a claude-code -y
    $missingSkills = @()
    foreach ($skill in @('meshy-3d-generation', 'meshy-3d-printing')) {
        if (-not (Test-Path -LiteralPath (Join-Path $skillsDir "$skill\SKILL.md"))) { $missingSkills += $skill }
    }
    if ($missingSkills.Count -eq 0) {
        Write-Ok "Skills installed in $skillsDir"
        Set-Row 'Meshy skill pack' Installed 'yes'
        Set-Row 'Meshy skill pack' Code 'yes'
        Set-Row 'Meshy skill pack' Desktop 'Code tab only'
        Add-Manual 'Meshy skill pack' 'For Desktop chat, upload the skill folders as zips in Settings > Capabilities'
    } else {
        Write-Note "Missing after install: $($missingSkills -join ', ')"
        Set-Row 'Meshy skill pack' Installed 'no'
        Add-Manual 'Meshy skill pack' 'Run the npx skills add command again and read its error'
    }
}

# --------------------------------------------------- 4. Claude Code (CLI) ---
Write-Step '4. Register MCP servers in Claude Code (user scope)'
$Claude = Find-Claude
$claudeJson = Join-Path $HOME '.claude.json'
$codeList = ''
if (-not $Claude) {
    Write-Note 'The claude command was not found, so Claude Code was skipped.'
    foreach ($tool in @('Blender MCP', 'Meshy MCP')) { Add-Manual $tool 'Install Claude Code, then run this again' }
} else {
    Write-Ok "claude at $Claude"
    $env:SETUP_CLAUDE_BIN = $Claude
    $uvxArg = '-'
    if ($Uvx) {
        $uvxArg = $Uvx
        Write-Host '  Preparing the blender-mcp Python environment (this does not start the server)...'
        & $Uvx --python 3.12 --from blender-mcp python -c "import blender_mcp_shim" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Ok 'blender-mcp environment ready.' }
        else { Write-Note "Preparing blender-mcp failed (exit code $LASTEXITCODE). Its first start may be slow." }
    } else {
        Write-Note 'uvx was not found, so the blender server was skipped.'
        Add-Manual 'Blender MCP' 'Install uv, then run this again'
    }
    & $Node $Helper register-code $uvxArg
    $codeList = Invoke-ClaudeMcpList
    $blenderState = Get-McpListStatus $codeList 'blender'
    $meshyState = Get-McpListStatus $codeList 'meshy'
    if ($blenderState -eq 'failed to connect' -or $meshyState -eq 'failed to connect') {
        Write-Note 'A server failed its first health check, often because of a first-time download. Checking once more...'
        Start-Sleep -Seconds 5
        $codeList = Invoke-ClaudeMcpList
        $blenderState = Get-McpListStatus $codeList 'blender'
        $meshyState = Get-McpListStatus $codeList 'meshy'
    }
    $codeKeys = Get-ConfigKeys $claudeJson
    foreach ($pair in @(@('Blender MCP', 'blender', $blenderState), @('Meshy MCP', 'meshy', $meshyState))) {
        if ($codeKeys -contains $pair[1]) {
            $state = $pair[2]
            if (-not $state) { $state = 'not in list' }
            Set-Row $pair[0] Code "yes ($state)"
        }
    }
}

# ------------------------------------------------------- 5. Claude Desktop ---
Write-Step '5. Register the same servers in the Claude desktop app'
$roamingDir = Join-Path $env:APPDATA 'Claude'
$desktopDirs = @()
if (Test-Path -LiteralPath $roamingDir) { $desktopDirs += $roamingDir }
foreach ($package in @(Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'Packages') -Directory -Filter 'Claude_*' -ErrorAction SilentlyContinue)) {
    $storeDir = Join-Path $package.FullName 'LocalCache\Roaming\Claude'
    if (Test-Path -LiteralPath $storeDir) { $desktopDirs += $storeDir }
}
if ($desktopDirs.Count -eq 0) {
    Write-Note "The Claude desktop app folder $roamingDir was not found."
    if (Confirm-Step "Create $roamingDir\claude_desktop_config.json anyway?") {
        New-Item -ItemType Directory -Path $roamingDir -Force | Out-Null
        $desktopDirs += $roamingDir
    }
}
$DesktopFiles = @()
foreach ($dir in $desktopDirs) { $DesktopFiles += (Join-Path $dir 'claude_desktop_config.json') }
if ($DesktopFiles.Count -eq 0) {
    foreach ($tool in @('Blender MCP', 'Meshy MCP')) { Add-Manual $tool 'Install the Claude desktop app, then run this again' }
} else {
    if ($DesktopFiles.Count -gt 1) { Write-Note 'Found a Microsoft Store install too, so both config files are updated.' }
    $uvxArg = '-'
    if ($Uvx) { $uvxArg = $Uvx }
    & $Node $Helper register-desktop $uvxArg @DesktopFiles
    $inAll = @{ blender = $true; meshy = $true }
    foreach ($file in $DesktopFiles) {
        $keys = Get-ConfigKeys $file
        foreach ($name in @('blender', 'meshy')) { if ($keys -notcontains $name) { $inAll[$name] = $false } }
    }
    if ($Uvx -and $inAll['blender']) { Set-Row 'Blender MCP' Desktop 'yes' }
    if ($inAll['meshy']) { Set-Row 'Meshy MCP' Desktop 'yes' }
    foreach ($tool in @('Blender MCP', 'Meshy MCP')) { Add-Manual $tool 'Restart the Claude desktop app' }
}
if ($addonReady -and $Uvx) {
    Set-Row 'Blender MCP' Installed 'yes'
    Add-Manual 'Blender MCP' 'In Blender: N > MCP for Blender tab, connect if needed'
} elseif ($Uvx) {
    Set-Row 'Blender MCP' Installed 'server yes, add-on no'
} else {
    Set-Row 'Blender MCP' Installed 'no'
}

# --------------------------------------------------------------- 6. Spline ---
Write-Step '6. Spline'
function Find-Spline {
    try {
        $app = Get-StartApps -ErrorAction Stop | Where-Object { $_.Name -like 'Spline*' } | Select-Object -First 1
        if ($app) { return $app.Name }
    } catch { }
    foreach ($menu in @("$env:APPDATA\Microsoft\Windows\Start Menu\Programs", "$env:ProgramData\Microsoft\Windows\Start Menu\Programs")) {
        $link = Get-ChildItem -LiteralPath $menu -Recurse -Filter 'Spline*.lnk' -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($link) { return $link.BaseName }
    }
    return $null
}
$spline = Find-Spline
if (-not $spline -and $Winget) {
    Write-Host '  Searching winget for Spline...'
    & $Winget search Spline --accept-source-agreements
    Write-Host '  I cannot verify which result, if any, is the official Spline desktop app.'
    $splineId = Read-Host '  Type the Id to install it (it may ask for admin rights), or press Enter to skip'
    if ($splineId -and $splineId.Trim()) {
        & $Winget install -e --id $splineId.Trim() --accept-source-agreements --accept-package-agreements
        Write-Host "  winget finished with exit code $LASTEXITCODE."
        $spline = Find-Spline
    }
}
if (-not $spline) {
    Write-Note "Spline is not installed. Opening $SplineDownloadUrl so you can install it."
    Start-Process $SplineDownloadUrl
}
$answer = Read-Host '  Install Spline if needed, open it, and sign in. Press Enter when it is open, or type skip'
if ($answer -match '^\s*skip\s*$') {
    Set-Row 'Spline MCP' Installed 'skipped'
    Add-Manual 'Spline MCP' 'Install and open Spline, then run this again'
} else {
    $spline = Find-Spline
    if ($spline) { Set-Row 'Spline MCP' Installed "yes ($spline)" }
    else { Set-Row 'Spline MCP' Installed 'not detected' }
    $desktopHasSpline = $false
    foreach ($file in $DesktopFiles) {
        if (@(Get-ConfigKeys $file | Where-Object { $_ -match 'spline' }).Count -gt 0) { $desktopHasSpline = $true }
    }
    $codeHasSpline = $false
    if ($Claude) {
        $splineList = Invoke-ClaudeMcpList
        $splineState = Get-McpListStatus $splineList '[^:\s]*[Ss]pline[^:\s]*'
        if ($splineState) { $codeHasSpline = $true; Set-Row 'Spline MCP' Code "yes ($splineState)" }
    }
    if ($desktopHasSpline) { Set-Row 'Spline MCP' Desktop 'yes' }
    if ($desktopHasSpline) { Write-Ok 'Spline is in the Claude desktop config.' }
    else { Write-Note 'No Spline entry in the Claude desktop config.' }
    if ($codeHasSpline) { Write-Ok 'Spline is in claude mcp list.' }
    else { Write-Note 'No Spline entry in claude mcp list.' }

    if (-not $codeHasSpline -and $Claude) {
        Write-Host "  Spline also runs a hosted MCP server at $SplineHostedUrl."
        Write-Host '  I found it in a web search but could not verify it.'
        if (Confirm-Step 'Register that hosted Spline server in Claude Code?') {
            & $Node $Helper add-http spline $SplineHostedUrl
            if ((Get-ConfigKeys $claudeJson) -contains 'spline') {
                Set-Row 'Spline MCP' Code 'yes (hosted, needs sign-in)'
                Add-Manual 'Spline MCP' 'In Claude Code run /mcp and sign in to spline'
            }
        }
    }
    if (-not $desktopHasSpline) {
        Add-Manual 'Spline MCP' "Desktop app: Settings > Connectors > Add custom connector, URL $SplineHostedUrl"
    }
}

# ---------------------------------------------------------- 7. final check ---
Write-Step '7. Final check'
Show-Report
Write-Host 'Next:' -ForegroundColor Cyan
Write-Host '  1. Quit the Claude desktop app from the system tray, then open it again.'
Write-Host '  2. Open Blender, press N, and open the "MCP for Blender" tab. The add-on connects by itself;'
Write-Host '     if it is not connected, click "Connect to MCP server".'
Write-Host '  3. Use only ONE Claude app with the Blender server at a time.'
Write-Host '  This script did not start blender-mcp. Only the claude mcp list health check ran it for a moment.'
