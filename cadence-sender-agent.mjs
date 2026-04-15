#!/usr/bin/env node

import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { CloseClient, sendMessageForLead } from "./close_guardrail/close_guardrail.mjs";

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const missionControlFile = path.join(root, "mission-control-data", "latest.json");
const refreshMetaFile = path.join(root, ".cache", "mission-control-refresh", "latest-meta.json");
const stateDir = path.join(root, ".cache", "agent-control", "cadence-sender");
const stateFile = path.join(stateDir, "latest.json");
const stateMarkdownFile = path.join(stateDir, "latest.md");
const outputDir = path.join(root, "close_guardrail", "output");
const auditLogFile = path.join(outputDir, "guardrail-audit.jsonl");

function loadDotEnvClose() {
  const candidates = [
    path.join(process.cwd(), ".env.close"),
    path.join(root, ".env.close"),
    path.join(root, "..", ".env.close"),
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

function isoNow() {
  return new Date().toISOString();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function recentLeadSet(previousState) {
  if (!previousState || previousState.run_day !== todayIso()) return new Set();
  return new Set((previousState.drafted || []).map((item) => item.lead_id).filter(Boolean));
}

async function loadTodayDraftsFromAudit(candidateLeadIds) {
  if (!fsSync.existsSync(auditLogFile)) return [];
  const text = await fs.readFile(auditLogFile, "utf8");
  const items = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed.entity_type === "lead_message" &&
        parsed.action === "drafted" &&
        parsed.channel === "email" &&
        typeof parsed.timestamp === "string" &&
        parsed.timestamp.startsWith(todayIso()) &&
        candidateLeadIds.has(parsed.entity_id)
      ) {
        items.push({
          lead_id: parsed.entity_id,
          lead_name: null,
          subject: parsed.subject,
          activity_id: parsed.activity_id,
          status: "draft",
        });
      }
    } catch {}
  }
  const seen = new Set();
  return items.filter((item) => {
    if (!item.lead_id || seen.has(item.lead_id)) return false;
    seen.add(item.lead_id);
    return true;
  });
}

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: root,
      env: { ...process.env },
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

function buildSummary(result) {
  const liveLabel = result.mode === "live-send" ? "sent" : "draft";
  if (result.drafted_count > 0) {
    return `Prepared ${result.drafted_count} cadence ${liveLabel}${result.drafted_count === 1 ? "" : "s"} from ${result.queue_size} ready lead${result.queue_size === 1 ? "" : "s"}.`;
  }
  if (result.queue_size > 0) {
    return `Queue has ${result.queue_size} ready lead${result.queue_size === 1 ? "" : "s"}, but none needed a new draft in this pass.`;
  }
  return "No cadence-ready Andre leads needed drafting in this pass.";
}

function buildCadenceTouch(entry) {
  const stage = entry.workflowStage || "touch_1_call_probe";
  const firstName = String(entry.leadName || "there").split(/\s+/)[0];
  const primary = entry.bestCallSlot || "10:00 AM";
  const fallback = entry.secondBestCallSlot || "1:00 PM";

  if (stage === "touch_1_call_probe") {
    return {
      subject: `Quick question about your event`,
      body: [
        `Hi ${firstName},`,
        "",
        "Just so I understand, what are you still trying to get clear on for your event?",
        "",
        "Sometimes at this point people are still trying to sort out whether the food, setup, or overall fit really makes sense for what they have in mind.",
        "",
        `Would it make more sense for us to jump on a quick call at ${primary} or ${fallback}?`,
      ].join("\n"),
    };
  }

  if (stage === "touch_2_call_plus_tasting") {
    return {
      subject: `Quick next step for your event`,
      body: [
        `Hi ${firstName},`,
        "",
        "I wanted to circle back because I still do not have a clear read on what you are trying to finalize for your event.",
        "",
        `Would it make more sense for us to jump on a quick call at ${primary} or ${fallback}, or should I save you a spot for our next tasting so you can experience the food before deciding?`,
      ].join("\n"),
    };
  }

  return {
    subject: `Following up on your event`,
    body: [
      `Hi ${firstName},`,
      "",
      "I wanted to follow up once more because I still do not have a clear read on where things stand for you.",
      "",
      `Would it make more sense for us to jump on a quick call at ${primary} or ${fallback}, or should I save you a spot for the next tasting?`,
    ].join("\n"),
  };
}

function renderMarkdown(result) {
  const lines = [
    "# Cadence Sender",
    "",
    `- Last run: ${result.last_run_at}`,
    `- Mode: ${result.mode}`,
    `- Status: ${result.status}`,
    `- Queue size: ${result.queue_size}`,
    `- Drafted: ${result.drafted_count}`,
    `- Skipped: ${result.skipped_count}`,
    `- Failures: ${result.failure_count}`,
    "",
    `Summary: ${result.summary}`,
    "",
    "## Drafted",
  ];
  if (!result.drafted.length) {
    lines.push("- None");
  } else {
    for (const item of result.drafted) {
      lines.push(`- ${item.lead_name} | ${item.subject} | ${item.activity_id}`);
    }
  }
  lines.push("", "## Skipped");
  if (!result.skipped.length) {
    lines.push("- None");
  } else {
    for (const item of result.skipped) {
      lines.push(`- ${item.lead_name} | ${item.reason}`);
    }
  }
  lines.push("", "## Failures");
  if (!result.failures.length) {
    lines.push("- None");
  } else {
    for (const item of result.failures) {
      lines.push(`- ${item.lead_name} | ${item.error}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  if (!process.env.CLOSE_API_KEY) {
    throw new Error("Cadence Sender cannot run because CLOSE_API_KEY is missing.");
  }

  const data = await readJson(missionControlFile);
  if (!data?.crm?.cadenceBuckets?.ready && !data?.crm?.cadenceControl?.readyForAutomation) {
    throw new Error("Mission Control latest.json does not contain cadence automation data.");
  }

  const previousState = await readJson(stateFile);
  const alreadyDraftedToday = recentLeadSet(previousState);
  const queue = (data.crm.cadenceControl?.readyForAutomation || data.crm.cadenceBuckets.ready || []).filter((entry) => entry?.leadId);
  const batchSize = Number(process.env.CADENCE_SENDER_BATCH_SIZE || "4");
  const candidates = queue.filter((entry) => !alreadyDraftedToday.has(entry.leadId)).slice(0, batchSize);
  const sendLive = String(process.env.CADENCE_SENDER_SEND_LIVE || "").toLowerCase() === "1"
    || String(process.env.CADENCE_SENDER_SEND_LIVE || "").toLowerCase() === "true";

  const client = new CloseClient(process.env.CLOSE_API_KEY, process.env.CLOSE_API_BASE_URL);
  const ownerName = process.env.CLOSE_OWNER_NAME || "Andre";
  const ownerId = process.env.CLOSE_OWNER_ID || null;

  const drafted = [];
  const skipped = queue
    .filter((entry) => alreadyDraftedToday.has(entry.leadId))
    .map((entry) => ({
      lead_id: entry.leadId,
      lead_name: entry.leadName,
      reason: "Already drafted earlier today.",
    }));
  const failures = [];

  for (const entry of candidates) {
    try {
      const touch = buildCadenceTouch(entry);
      const result = await sendMessageForLead(client, {
        leadId: entry.leadId,
        leadName: null,
        channel: "email",
        sendLive,
        body: touch.body,
        bodyHtml: null,
        subject: touch.subject,
        sender: null,
        localPhone: null,
      }, ownerName, ownerId, outputDir);
      drafted.push({
        lead_id: entry.leadId,
        lead_name: entry.leadName,
        subject: result.subject,
        activity_id: result.activity_id,
        status: result.status,
        best_call_slot: entry.bestCallSlot || null,
        next_step_due: entry.nextStepDue || null,
        workflow_stage: entry.workflowStage || null,
        link: entry.link || null,
      });
    } catch (error) {
      failures.push({
        lead_id: entry.leadId,
        lead_name: entry.leadName,
        error: error.message || String(error),
      });
    }
  }

  const todayAuditDrafts = await loadTodayDraftsFromAudit(new Set(queue.map((entry) => entry.leadId)));
  const draftedByLead = new Map(todayAuditDrafts.map((item) => [item.lead_id, item]));
  for (const item of drafted) {
    draftedByLead.set(item.lead_id, item);
  }
  const allDrafted = queue
    .map((entry) => ({
      ...(draftedByLead.get(entry.leadId) || {}),
      lead_id: entry.leadId,
      lead_name: entry.leadName,
      best_call_slot: entry.bestCallSlot || null,
      next_step_due: entry.nextStepDue || null,
      link: entry.link || null,
    }))
    .filter((item) => item.activity_id);

  const result = {
    agent: "Cadence Sender",
    mode: sendLive ? "live-send" : "draft-first",
    status: failures.length ? (drafted.length ? "partial" : "blocked") : "healthy",
    run_day: todayIso(),
    last_run_at: isoNow(),
    queue_size: queue.length,
    drafted_count: allDrafted.length,
    skipped_count: skipped.length,
    failure_count: failures.length,
    drafted: allDrafted,
    skipped,
    failures,
  };
  result.summary = buildSummary(result);

  await ensureDir(stateDir);
  await fs.writeFile(stateFile, JSON.stringify(result, null, 2));
  await fs.writeFile(stateMarkdownFile, renderMarkdown(result), "utf8");

  const refreshMeta = await readJson(refreshMetaFile, {});
  const sourceDir = refreshMeta?.sourceDir || path.join(root, "close_guardrail", "output");
  await runNodeScript(path.join(root, "build-mission-control-data.mjs"), ["--source-dir", sourceDir]);

  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
