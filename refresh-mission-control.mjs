#!/usr/bin/env node

import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const refreshOutputDir = path.join(root, ".cache", "mission-control-refresh");

function loadDotEnvClose() {
  const candidates = [
    path.join(process.cwd(), ".env.close"),
    path.join(root, ".env.close"),
  ];

  for (const candidate of candidates) {
    if (!fsSync.existsSync(candidate)) continue;
    const content = fsSync.readFileSync(candidate, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key && !(key in process.env)) process.env[key] = value;
    }
  }
}

loadDotEnvClose();

function ensureCloseCredentials() {
  if (process.env.CLOSE_API_KEY) {
    return;
  }

  throw new Error(
    "Mission Control refresh cannot run live because CLOSE_API_KEY is missing. Add it to .env.close in the repo root or export it in the shell before running refresh-mission-control.mjs.",
  );
}

function runNodeScript(scriptPath, args = [], extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: root,
      env: { ...process.env, ...extraEnv },
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${path.basename(scriptPath)} exited with code ${code}.`));
    });

    child.on("error", reject);
  });
}

async function hasMorningSnapshot(dir) {
  try {
    const entries = await fs.readdir(dir);
    return entries.some((name) => /^\d{4}-\d{2}-\d{2}-morning\.json$/.test(name));
  } catch {
    return false;
  }
}

async function main() {
  ensureCloseCredentials();

  await fs.rm(refreshOutputDir, { recursive: true, force: true });
  await fs.mkdir(refreshOutputDir, { recursive: true });

  const guardrailArgs = ["--checkpoint", "morning", "--output-dir", refreshOutputDir];
  if (process.env.MISSION_CONTROL_FORCE_RUN === "1") {
    guardrailArgs.push("--force-run");
  }

  await runNodeScript(path.join(root, "close_guardrail", "close_guardrail.mjs"), guardrailArgs);

  if (!(await hasMorningSnapshot(refreshOutputDir))) {
    process.stdout.write("No morning snapshot produced. This run is outside the checkpoint window.\n");
    return;
  }

  await runNodeScript(path.join(root, "build-mission-control-data.mjs"), ["--source-dir", refreshOutputDir]);
  process.stdout.write("Mission Control data refreshed.\n");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
