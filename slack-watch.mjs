#!/usr/bin/env node

import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const outputDir = path.join(root, ".cache", "slack-watch");
const outputFile = path.join(outputDir, "latest.json");
const stateFile = path.join(outputDir, "state.json");
const configFile = path.join(root, "slack-watch-config.json");
const slackApiBase = "https://slack.com/api";

function loadEnvFiles() {
  const candidates = [
    path.join(process.cwd(), ".env.close"),
    path.join(process.cwd(), ".env.slack"),
    path.join(root, ".env.close"),
    path.join(root, ".env.slack"),
    path.join(root, "..", ".env.close"),
    path.join(root, "..", ".env.slack"),
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

loadEnvFiles();

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fsSync.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseArgs(argv) {
  const result = {
    output: outputFile,
    forceFullScan: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--output") result.output = path.resolve(argv[++index]);
    else if (current === "--force-full-scan") result.forceFullScan = true;
  }

  return result;
}

async function slackApi(method, params = {}, tokenOverride = null) {
  const token = tokenOverride || process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("Slack token is required for slack-watch.");
  }

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    body.set(key, String(value));
  }

  const response = await fetch(`${slackApiBase}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(`${method} failed: ${payload.error || response.statusText}`);
  }
  return payload;
}

async function slackApiWithReadFallback(method, params = {}) {
  try {
    return await slackApi(method, params, process.env.SLACK_BOT_TOKEN || null);
  } catch (error) {
    const message = error.message || String(error);
    if (!/(not_in_channel|channel_not_found)/i.test(message) || !process.env.SLACK_USER_TOKEN) {
      throw error;
    }
    return slackApi(method, params, process.env.SLACK_USER_TOKEN);
  }
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function collectTextFromRichTextNode(node, pieces) {
  if (!node || typeof node !== "object") return;
  if (typeof node.text === "string") pieces.push(node.text);
  if (typeof node.name === "string") pieces.push(node.name);
  if (typeof node.url === "string") pieces.push(node.url);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((child) => collectTextFromRichTextNode(child, pieces));
    } else if (value && typeof value === "object") {
      collectTextFromRichTextNode(value, pieces);
    }
  }
}

function extractMessageText(message) {
  const pieces = [];
  if (message.text) pieces.push(message.text);
  if (Array.isArray(message.attachments)) {
    for (const attachment of message.attachments) {
      if (attachment.pretext) pieces.push(attachment.pretext);
      if (attachment.title) pieces.push(attachment.title);
      if (attachment.text) pieces.push(attachment.text);
      if (attachment.fallback) pieces.push(attachment.fallback);
    }
  }
  if (Array.isArray(message.blocks)) {
    message.blocks.forEach((block) => collectTextFromRichTextNode(block, pieces));
  }
  return normalizeText(pieces.join("\n"));
}

function extractCloseLink(text) {
  const match = text.match(/https:\/\/app\.close\.com\/lead\/[^\s)>]+/i);
  return match ? match[0] : null;
}

function extractLeadName(text) {
  const ownerPattern = /NAME[:`\s]+([^\n`]+?)\s+(EMAIL|📧|✉️|SUBJ|SUBJECT)/i;
  const ownerMatch = text.match(ownerPattern);
  if (ownerMatch) return normalizeText(ownerMatch[1]);

  const linePattern = /\bNAME\b[:`\s]+([^\n`]+)/i;
  const lineMatch = text.match(linePattern);
  if (lineMatch) return normalizeText(lineMatch[1]);

  return null;
}

function looksLikeCloseInbound(text) {
  const haystack = text.toLowerCase();
  return (
    haystack.includes("owner") &&
    haystack.includes("andre") &&
    (haystack.includes("open in close") || haystack.includes("app.close.com/lead/") || haystack.includes("subj"))
  );
}

function mentionsAndre(text, config) {
  const haystack = text.toLowerCase();
  const display = (config.andreDisplayName || "Andre Raw").toLowerCase();
  const userId = process.env.SLACK_ANDRE_USER_ID;
  return (
    haystack.includes(display) ||
    haystack.includes("@andre") ||
    (userId ? haystack.includes(`<@${userId.toLowerCase()}>`) : false)
  );
}

function isAssignedToAndre(text, config) {
  const haystack = text.toLowerCase();
  const display = (config.andreDisplayName || "Andre Raw").toLowerCase();
  return (
    (haystack.includes("owner") && haystack.includes("andre")) ||
    haystack.includes("01. 😎 andre") ||
    haystack.includes("01. :sunglasses: andre") ||
    haystack.includes(display) ||
    haystack.includes("@andre raw")
  );
}

function buildNextMove(kind, heartbeatMinutes) {
  if (kind === "inbound") {
    return "Read the latest comms and decide the next reply immediately. Ghost mode only.";
  }
  if (kind === "whatsapp" || kind === "crisp") {
    return "Only act if Andre is directly pulled in or the thread is escalated into the real inbox lane.";
  }
  if (kind === "lead_assignment" || kind === "lead_assignment_high_value") {
    return `Start 7-touch cadence review and decide first contact inside ${heartbeatMinutes} minutes.`;
  }
  if (kind === "tasting_calendar") {
    return "Use this as tasting-state confirmation, not an outreach trigger by itself.";
  }
  if (kind === "missed_calls") {
    return "Check whether this missed call should become a same-day callback.";
  }
  if (kind === "cadence_exception") {
    return "Review the exception before the lead drifts out of cadence.";
  }
  if (kind === "quotes") {
    return "Review quote-related movement and decide whether follow-up is needed.";
  }
  return "Review context and decide the next operator move.";
}

function buildReason(kind, text) {
  if (kind === "inbound") {
    return "Client communication hit an inbound channel and needs immediate awareness.";
  }
  if (kind === "whatsapp" || kind === "crisp") {
    return "Conversation signal exists, but it should only surface when Andre is explicitly needed.";
  }
  if (kind === "lead_assignment" || kind === "lead_assignment_high_value") {
    return "A lead appears assigned to Andre, which starts the communication clock.";
  }
  if (kind === "tasting_calendar") {
    return "A tasting/calendar event changed and may affect follow-up timing.";
  }
  if (kind === "missed_calls") {
    return "A missed-call signal landed in Slack.";
  }
  if (kind === "cadence_exception") {
    return "A cadence exception was surfaced in Slack.";
  }
  if (kind === "quotes") {
    return "Quote channel movement may need operator review.";
  }
  return text.slice(0, 180) || "Slack signal needs review.";
}

function classifySignal(channel, messageText, config) {
  const directMention = mentionsAndre(messageText, config);
  if (channel.kind === "inbound") {
    return looksLikeCloseInbound(messageText) ? "reply_now" : directMention ? "andre_mentioned" : "ignore";
  }
  if (channel.kind === "whatsapp" || channel.kind === "crisp") {
    return directMention ? "andre_mentioned" : "ignore";
  }
  if (channel.kind === "lead_assignment" || channel.kind === "lead_assignment_high_value") {
    if (isAssignedToAndre(messageText, config)) return "assigned_to_andre";
    return directMention ? "andre_mentioned" : "ignore";
  }
  if (channel.kind === "tasting_calendar") return directMention ? "andre_mentioned" : "ignore";
  if (channel.kind === "missed_calls") return directMention ? "andre_mentioned" : "ignore";
  if (channel.kind === "cadence_exception") return "cadence_exception";
  if (channel.kind === "quotes") return directMention ? "andre_mentioned" : "ignore";
  return directMention ? "andre_mentioned" : "ignore";
}

async function fetchReplies(channelId, threadTs) {
  const payload = await slackApiWithReadFallback("conversations.replies", {
    channel: channelId,
    ts: threadTs,
    limit: 10,
    inclusive: true,
  });
  return payload.messages || [];
}

async function fetchChannelSignals(channel, config, sinceTs) {
  const payload = await slackApiWithReadFallback("conversations.history", {
    channel: channel.id,
    limit: 20,
  });
  const messages = payload.messages || [];
  const signals = [];

  for (const message of messages) {
    const ts = Number(message.ts || 0);
    if (sinceTs && ts < sinceTs) continue;

    const texts = [extractMessageText(message)];
    if (message.reply_count && Number(message.reply_count) > 0) {
      try {
        const replies = await fetchReplies(channel.id, message.ts);
        texts.push(...replies.slice(1).map((reply) => extractMessageText(reply)));
      } catch {
        // Keep the watch layer resilient if replies fail for one message.
      }
    }

    const combinedText = normalizeText(texts.join("\n"));
    if (!combinedText) continue;

    const signalType = classifySignal(channel, combinedText, config);
    const directMention = mentionsAndre(combinedText, config);
    if (signalType === "ignore") continue;

    const leadName = extractLeadName(combinedText) || message.username || channel.label;
    signals.push({
      type: signalType === "watch" && directMention ? "andre_mentioned" : signalType,
      channelId: channel.id,
      channelLabel: channel.label,
      kind: channel.kind,
      priority: channel.priority,
      policy: channel.policy,
      ts: message.ts,
      timestamp: new Date(ts * 1000).toISOString(),
      item: leadName,
      reason: buildReason(channel.kind, combinedText),
      nextMove: buildNextMove(channel.kind, config.heartbeatMinutes || 10),
      owner: "Andre",
      status: channel.priority,
      link: extractCloseLink(combinedText),
      preview: combinedText.slice(0, 280),
      mention: directMention,
    });
  }

  return signals;
}

function summarizeSignals(signals, channels) {
  return {
    totalSignals: signals.length,
    replyNow: signals.filter((item) => item.type === "reply_now").length,
    assignedToAndre: signals.filter((item) => item.type === "assigned_to_andre").length,
    andreMentions: signals.filter((item) => item.type === "andre_mentioned").length,
    tastingSignals: signals.filter((item) => item.type === "tasting_signal").length,
    cadenceExceptions: signals.filter((item) => item.type === "cadence_exception").length,
    watchedChannels: channels.length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = readJson(configFile, null);
  if (!config) {
    throw new Error("slack-watch-config.json is required.");
  }

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  const state = readJson(stateFile, {});
  const nowSeconds = Date.now() / 1000;
  const defaultLookback = (config.lookbackMinutesOnFirstRun || 180) * 60;
  const sinceTs = args.forceFullScan
    ? 0
    : state.lastRunAt
      ? Number(state.lastRunAt)
      : nowSeconds - defaultLookback;

  const allSignals = [];
  const channelHealth = [];
  for (const channel of config.channels || []) {
    try {
      const signals = await fetchChannelSignals(channel, config, sinceTs);
      allSignals.push(...signals);
      channelHealth.push({
        channelId: channel.id,
        channelLabel: channel.label,
        priority: channel.priority,
        kind: channel.kind,
        policy: channel.policy,
        signals: signals.length,
        status: "ok",
      });
    } catch (error) {
      channelHealth.push({
        channelId: channel.id,
        channelLabel: channel.label,
        priority: channel.priority,
        kind: channel.kind,
        policy: channel.policy,
        signals: 0,
        status: "blocked",
        error: error.message || String(error),
      });
    }
  }

  allSignals.sort((left, right) => Number(right.ts) - Number(left.ts));

  const payload = {
    generated_at: new Date().toISOString(),
    source_label: "LIVE",
    mode: config.ghostMode ? "ghost" : "active",
    heartbeatMinutes: config.heartbeatMinutes || 10,
    workspace: config.workspace || null,
    summary: summarizeSignals(allSignals, config.channels || []),
    urgent: allSignals.filter((item) => item.type === "reply_now" || item.type === "assigned_to_andre" || item.type === "andre_mentioned").slice(0, 20),
    replyNow: allSignals.filter((item) => item.type === "reply_now").slice(0, 20),
    assignedToAndre: allSignals.filter((item) => item.type === "assigned_to_andre").slice(0, 20),
    mentions: allSignals.filter((item) => item.type === "andre_mentioned").slice(0, 20),
    tastingSignals: allSignals.filter((item) => item.type === "tasting_signal").slice(0, 20),
    cadenceExceptions: allSignals.filter((item) => item.type === "cadence_exception").slice(0, 20),
    channelHealth,
  };

  await fs.writeFile(args.output, JSON.stringify(payload, null, 2));
  await fs.writeFile(stateFile, JSON.stringify({ lastRunAt: nowSeconds }, null, 2));
  process.stdout.write(`${args.output}\n`);
}

main().catch(async (error) => {
  await fs.mkdir(outputDir, { recursive: true });
  const payload = {
    generated_at: new Date().toISOString(),
    source_label: "UNAVAILABLE",
    mode: "ghost",
    error: error.message || String(error),
    summary: {
      totalSignals: 0,
      replyNow: 0,
      assignedToAndre: 0,
      andreMentions: 0,
      tastingSignals: 0,
      cadenceExceptions: 0,
      watchedChannels: readJson(configFile, { channels: [] }).channels?.length || 0,
    },
    urgent: [],
    replyNow: [],
    assignedToAndre: [],
    mentions: [],
    tastingSignals: [],
    cadenceExceptions: [],
    channelHealth: [],
  };
  await fs.writeFile(outputFile, JSON.stringify(payload, null, 2));
  console.error(payload.error);
  process.exit(1);
});
