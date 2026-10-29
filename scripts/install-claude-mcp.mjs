#!/usr/bin/env node
/**
 * Install the Blender and Meshy MCP servers for every Claude app on this computer.
 *
 *   node scripts/install-claude-mcp.mjs              install both servers
 *   node scripts/install-claude-mcp.mjs --dry-run    show the changes, write nothing
 *   node scripts/install-claude-mcp.mjs --no-blender (or --no-meshy) install one server
 *
 * Targets:
 *   - Claude Code in every project: user scope, through the `claude` CLI.
 *   - Claude Desktop: claude_desktop_config.json, including Microsoft Store installs.
 *
 * The Meshy key comes from MESHY_API_KEY or a hidden prompt. It is written only to
 * this computer's Claude config files.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export const MESHY_PACKAGE = "@meshy-ai/meshy-mcp-server";
export const BLENDER_PACKAGE = "mcp-for-blender";
const BLENDER_PYTHON = "3.12";
const MESHY_KEY_PATTERN = /^msy_[A-Za-z0-9_-]+$/;
const FLAGS = new Set(["--dry-run", "--no-blender", "--no-meshy", "--help"]);
const UV_INSTALL = {
  win32: "winget install --id=astral-sh.uv -e",
  darwin: "brew install uv",
  linux: "curl -LsSf https://astral.sh/uv/install.sh | sh",
};

/** Server entries in the shape both Claude Code and Claude Desktop accept. */
export function buildServers({ platform, uvxPath, meshyKey, blender = true, meshy = true }) {
  const servers = {};
  if (blender) {
    servers.blender = { command: uvxPath, args: ["--python", BLENDER_PYTHON, BLENDER_PACKAGE] };
  }
  if (meshy) {
    // Native Windows cannot start npx (a .cmd file) directly, so it goes through cmd /c.
    servers.meshy =
      platform === "win32"
        ? { command: "cmd", args: ["/c", "npx", "-y", MESHY_PACKAGE], env: { MESHY_API_KEY: meshyKey } }
        : { command: "npx", args: ["-y", MESHY_PACKAGE], env: { MESHY_API_KEY: meshyKey } };
  }
  return servers;
}

export function findOnPath(name, platform = process.platform) {
  const result = spawnSync(platform === "win32" ? "where.exe" : "which", [name], { encoding: "utf8" });
  if (result.status !== 0 || !result.stdout) return null;
  const hits = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return (platform === "win32" && hits.find((hit) => /\.exe$/i.test(hit))) || hits[0] || null;
}

/** Absolute path to uvx, so GUI apps that miss the user's PATH can still start it. */
export function locateUvx(platform = process.platform, env = process.env, home = homedir()) {
  const onPath = findOnPath("uvx", platform);
  if (onPath) return { path: onPath, found: true };
  const fallback =
    platform === "win32"
      ? join(env.USERPROFILE || home, ".local", "bin", "uvx.exe")
      : join(home, ".local", "bin", "uvx");
  return { path: fallback, found: existsSync(fallback) };
}

/** Claude Desktop config files for every install found on this computer. */
export function desktopConfigFiles(platform = process.platform, env = process.env, home = homedir()) {
  const dirs = [];
  if (platform === "win32") {
    dirs.push(join(env.APPDATA || join(home, "AppData", "Roaming"), "Claude"));
    // Microsoft Store (MSIX) installs keep their config inside the package folder.
    const packages = join(env.LOCALAPPDATA || join(home, "AppData", "Local"), "Packages");
    for (const name of listDir(packages)) {
      if (/^Claude_/i.test(name)) dirs.push(join(packages, name, "LocalCache", "Roaming", "Claude"));
    }
  } else if (platform === "darwin") {
    dirs.push(join(home, "Library", "Application Support", "Claude"));
  } else {
    dirs.push(join(env.XDG_CONFIG_HOME || join(home, ".config"), "Claude"));
  }
  return dirs.filter((dir) => existsSync(dir)).map((dir) => join(dir, "claude_desktop_config.json"));
}

function listDir(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/** Add the servers to a Claude Desktop config, keeping everything else in it. */
export function mergeDesktopConfig(text, servers) {
  const source = (text ?? "").replace(/^﻿/, "");
  const config = source.trim() ? JSON.parse(source) : {};
  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("the file is not a JSON object");
  }
  const existing = config.mcpServers ?? {};
  if (existing === null || typeof existing !== "object" || Array.isArray(existing)) {
    throw new Error('its "mcpServers" value is not an object');
  }
  config.mcpServers = { ...existing, ...servers };
  return JSON.stringify(config, null, 2) + "\n";
}

const CMD_SPECIAL = /[&|<>^%!\r\n]/;

/** Quote one argument for a Windows command line (CommandLineToArgvW rules). */
export function quoteWindowsArg(arg) {
  if (CMD_SPECIAL.test(arg)) {
    throw new Error(`cannot pass ${JSON.stringify(arg)} safely through cmd.exe`);
  }
  if (arg !== "" && !/[\s"]/.test(arg)) return arg;
  let out = '"';
  let slashes = 0;
  for (const ch of arg) {
    if (ch === "\\") {
      slashes += 1;
      continue;
    }
    out += ch === '"' ? "\\".repeat(slashes * 2 + 1) + '"' : "\\".repeat(slashes) + ch;
    slashes = 0;
  }
  return out + "\\".repeat(slashes * 2) + '"';
}

function runClaude(args, platform) {
  if (platform === "win32") {
    // claude is often claude.cmd, which Node can only start through the shell.
    const line = ["claude", ...args].map(quoteWindowsArg).join(" ");
    return spawnSync(line, { encoding: "utf8", shell: true });
  }
  return spawnSync("claude", args, { encoding: "utf8" });
}

const output = (result) => `${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`.trim();

function installClaudeCode(servers, { platform, dryRun }) {
  if (!findOnPath("claude", platform)) {
    console.warn("! Claude Code: the claude command was not found, so it was skipped.");
    return true;
  }
  let ok = true;
  for (const [name, config] of Object.entries(servers)) {
    if (dryRun) {
      console.log(`  Claude Code: would add ${name} at user scope (all projects).`);
      continue;
    }
    const add = ["mcp", "add-json", "-s", "user", name, JSON.stringify(config)];
    let result = runClaude(add, platform);
    if (result.status !== 0 && /already exists/i.test(output(result))) {
      runClaude(["mcp", "remove", "-s", "user", name], platform);
      result = runClaude(add, platform);
    }
    if (result.status === 0) {
      console.log(`  Claude Code: ${name} added for all projects.`);
    } else {
      ok = false;
      console.warn(`! Claude Code: adding ${name} failed: ${output(result)}`);
    }
  }
  return ok;
}

function installClaudeDesktop(servers, { platform, dryRun }) {
  const files = desktopConfigFiles(platform);
  if (files.length === 0) {
    console.warn("! Claude Desktop: not found. Open it once, quit it, and run this script again.");
    return true;
  }
  let ok = true;
  for (const file of files) {
    const existed = existsSync(file);
    let next;
    try {
      next = mergeDesktopConfig(existed ? readFileSync(file, "utf8") : "", servers);
    } catch (error) {
      ok = false;
      console.warn(`! Claude Desktop: skipped ${file} because ${error.message}. Fix the file and run this again.`);
      continue;
    }
    if (dryRun) {
      console.log(`  Claude Desktop: would update ${file}`);
      continue;
    }
    if (existed) copyFileSync(file, `${file}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, next, "utf8");
    console.log(`  Claude Desktop: updated ${file}${existed ? " (backup saved next to it)" : ""}`);
  }
  return ok;
}

function describe(servers) {
  return Object.entries(servers)
    .map(([name, { command, args, env }]) => {
      const vars = Object.keys(env ?? {}).map((key) => ` ${key}=<hidden>`).join("");
      return `  ${name}: ${[command, ...args].join(" ")}${vars}`;
    })
    .join("\n");
}

async function askHidden(question) {
  const { stdin, stdout } = process;
  stdout.write(question);
  if (!stdin.isTTY) {
    const { createInterface } = await import("node:readline");
    const lines = createInterface({ input: stdin });
    for await (const line of lines) {
      lines.close();
      return line.trim();
    }
    return "";
  }
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();
  return new Promise((resolve) => {
    let value = "";
    const stop = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stop();
          resolve(value.trim());
          return;
        }
        if (ch === "\u0003") {
          stop();
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else if (ch >= " ") value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

export async function main(argv, platform = process.platform) {
  const flags = new Set(argv);
  const unknown = [...flags].filter((flag) => !FLAGS.has(flag));
  if (unknown.length > 0 || flags.has("--help")) {
    if (unknown.length > 0) console.error(`Unknown option: ${unknown.join(" ")}`);
    console.log("Usage: node scripts/install-claude-mcp.mjs [--dry-run] [--no-blender] [--no-meshy]");
    return unknown.length > 0 ? 2 : 0;
  }
  const dryRun = flags.has("--dry-run");
  const wantBlender = !flags.has("--no-blender");
  let wantMeshy = !flags.has("--no-meshy");

  let uvxPath;
  if (wantBlender) {
    const uvx = locateUvx(platform);
    uvxPath = uvx.path;
    if (!uvx.found) {
      console.warn(`! uv was not found. Blender will use ${uvx.path} once you install uv: ${UV_INSTALL[platform] ?? UV_INSTALL.linux}`);
    }
  }

  let meshyKey = "";
  if (wantMeshy) {
    meshyKey =
      (process.env.MESHY_API_KEY ?? "").trim() ||
      (await askHidden("Meshy API key (starts with msy_; typing is hidden; press Enter to skip Meshy): "));
    if (!meshyKey) {
      console.warn("! No Meshy key was given, so Meshy was skipped.");
      wantMeshy = false;
    } else if (!MESHY_KEY_PATTERN.test(meshyKey)) {
      console.error("That is not a Meshy API key. Keys start with msy_ and contain only letters, digits, - and _.");
      return 1;
    }
  }

  const servers = buildServers({ platform, uvxPath, meshyKey, blender: wantBlender, meshy: wantMeshy });
  if (Object.keys(servers).length === 0) {
    console.log("Nothing to install.");
    return 0;
  }

  console.log(`${dryRun ? "Dry run, nothing is written. " : ""}MCP servers:\n${describe(servers)}`);
  const codeOk = installClaudeCode(servers, { platform, dryRun });
  const desktopOk = installClaudeDesktop(servers, { platform, dryRun });
  if (dryRun) return codeOk && desktopOk ? 0 : 1;

  const blenderStep = servers.blender
    ? `
  3. For Blender: run "uvx --python ${BLENDER_PYTHON} ${BLENDER_PACKAGE} install-addon", enable "Interface: MCP for Blender"
     in Blender under Edit > Preferences > Add-ons, and keep Blender open while you use it.
     Use one Claude app at a time with Blender, since they share the add-on's port.`
    : "";
  console.log(`
Next:
  1. Quit Claude Desktop completely (system tray or menu bar), then open it again.
  2. Check Claude Code with: claude mcp list${blenderStep}
  If a project still shows an old entry for one of these servers, remove it there with:
     claude mcp remove -s local <name>`);
  return codeOk && desktopOk ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
