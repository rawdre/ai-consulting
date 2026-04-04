#!/usr/bin/env node

import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDotEnvClose() {
  const candidates = [
    path.join(process.cwd(), ".env.close"),
    path.join(__dirname, ".env.close"),
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

const ET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DEFAULT_CLOSE_API_BASE = "https://api.close.com/api/v1/";
const DEFAULT_OUTPUT_DIR = path.join(__dirname, "output");
const EMAIL_SIGNATURE_LINES = [
  "Regards,",
  "Andre Raw",
  "\u200b\u200bCatering Event Coordinator",
  "\ud83d\udcf2 C: (978) 235-3791",
  "\ud83d\udcf2 W: (978) 381-1212",
  "Facebook | Instagram | Website",
];
const COMEKETO_CALCULATOR_URL = "https://rawdre.github.io/comeketo-menu-landing/#packages";
const DEFAULT_LEAD_OWNER_CUSTOM_FIELD = process.env.CLOSE_LEAD_OWNER_CUSTOM_FIELD || "00. 🦖 LEAD OWNER";
const CHECKPOINT_TIMES = {
  morning: { hour: 9, minute: 0 },
  heartbeat: { hour: 13, minute: 0 },
  eod: { hour: 18, minute: 30 },
};
const PORTUGUESE_HINTS = [
  "ola",
  "olá",
  "obrigado",
  "obrigada",
  "gostaria",
  "vamos",
  "amanha",
  "amanhã",
  "degust",
  "agendar",
  "horario",
  "horário",
];
const SMARTLIST_FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "live.com",
  "msn.com",
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "ymail.com",
  "proton.me",
  "protonmail.com",
  "cox.net",
  "charter.net",
  "privaterelay.appleid.com",
  "googlegroups.com",
  "aim.com",
  "rocketmail.com",
  "xtra.co.nz",
]);
const SMARTLIST_JUNK_RE = /(eventective|theknot|weddingwire|zola|privaterelay|icloud|myeventective|placeholder|simpletalk|close\.com|bark\.com|dropbox|hubstaff|clickup|addevent)/i;
const SMARTLIST_BAD_LEAD_RE = /(mail delivery subsystem|close crm|close support|team zola|weddingpro|simpletalk test|first_name last_name|test tested|bark\.com|dropbox|hubstaff|clickup team|addevent\.com|spyros marinos test)/i;
const SMARTLIST_WON_RE = /(won|booked|fully paid|job complete|converted to b2b|converterted to b2b|archived catering customer)/i;
const SMARTLIST_DEAD_RE = /(lost|refunded|not interested|do not call|dormant|cold prospect|lost catering customer)/i;
const SMARTLIST_COMPANY_RE = /(llc\b|inc\b|ltd\b|corp\b|company\b|co\.?\b|group\b|studio\b|media\b|services\b|solutions\b|agency\b|associates\b|museum\b|club\b|venue\b|events\b|event\b|photography\b|photo\b|video\b|floral\b|rentals\b|restaurant\b|hotel\b|resort\b|university\b|college\b|bank\b|credit union\b|foundation\b|church\b|temple\b|school\b|construction\b|contracting\b|builders\b|catering\b|speedway\b|ballroom\b|farm\b|estate\b|gallery\b|inn\b|distillery\b|jewelry\b|botanic\b|garden\b|meeting house\b)/i;
const SMARTLIST_PAINTING_RE = /(paint|painting|painter|painters|coatings|wallcovering|drywall|contracting|construction|floor coverings)/i;
const SMARTLIST_VENUE_RE = /(venue|museum|hall|club|speedway|events\b|event\b|ballroom|farm|photography|photo|video|planner|planning|floral|dj|rentals|restaurant|hotel|resort|country club|church|temple|estate|gallery|inn|garden|meeting house|distillery)/i;

function isoNow() {
  return new Date().toISOString().replace(".000Z", "Z");
}

function parseArgs(argv) {
  const result = {
    mode: "sweep",
    checkpoint: "auto",
    forceRun: false,
    allowRollover: false,
    ownerName: process.env.CLOSE_OWNER_NAME || "Andre",
    ownerId: process.env.CLOSE_OWNER_ID || null,
    outputDir: process.env.CLOSE_GUARDRAIL_OUTPUT_DIR || DEFAULT_OUTPUT_DIR,
    apiBaseUrl: process.env.CLOSE_API_BASE_URL || DEFAULT_CLOSE_API_BASE,
    snapshot: null,
    leadName: null,
    leadId: null,
    channel: "auto",
    sendLive: false,
    subject: null,
    body: null,
    quoteTiers: [],
    quoteGuests: null,
    quoteAppetizersPp: 0,
    quoteServiceStyle: "buffet",
    quoteDate: null,
    quoteEventType: null,
    quoteTone: "default",
    sender: process.env.CLOSE_GUARDRAIL_EMAIL_SENDER || null,
    localPhone: process.env.CLOSE_GUARDRAIL_SMS_LOCAL_PHONE || null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--mode") result.mode = argv[++index];
    if (current === "--checkpoint") result.checkpoint = argv[++index];
    else if (current === "--snapshot") result.snapshot = argv[++index];
    else if (current === "--owner-name") result.ownerName = argv[++index];
    else if (current === "--owner-id") result.ownerId = argv[++index];
    else if (current === "--output-dir") result.outputDir = argv[++index];
    else if (current === "--api-base-url") result.apiBaseUrl = argv[++index];
    else if (current === "--lead-name") result.leadName = argv[++index];
    else if (current === "--lead-id") result.leadId = argv[++index];
    else if (current === "--channel") result.channel = argv[++index];
    else if (current === "--subject") result.subject = argv[++index];
    else if (current === "--body") result.body = argv[++index];
    else if (current === "--quote-tier") result.quoteTiers.push(argv[++index]);
    else if (current === "--quote-guests") result.quoteGuests = argv[++index];
    else if (current === "--quote-appetizers-pp") result.quoteAppetizersPp = Number(argv[++index]);
    else if (current === "--quote-service-style") result.quoteServiceStyle = argv[++index];
    else if (current === "--quote-date") result.quoteDate = argv[++index];
    else if (current === "--quote-event-type") result.quoteEventType = argv[++index];
    else if (current === "--quote-tone") result.quoteTone = argv[++index];
    else if (current === "--sender") result.sender = argv[++index];
    else if (current === "--local-phone") result.localPhone = argv[++index];
    else if (current === "--send-live") result.sendLive = true;
    else if (current === "--force-run") result.forceRun = true;
    else if (current === "--allow-rollover") result.allowRollover = true;
  }
  return result;
}

function decodeCliText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t");
}

function appendEmailSignature(body) {
  const normalized = String(body || "").trimEnd();
  if (!normalized) return EMAIL_SIGNATURE_LINES.join("\n");
  if (/Regards,\s*\nAndre Raw/i.test(normalized)) return normalized;
  return `${normalized}\n\n-----\n${EMAIL_SIGNATURE_LINES.join("\n")}`;
}

function partsInET(date = new Date()) {
  const parts = Object.fromEntries(
    ET_FORMATTER.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function todayEtIso(date = new Date()) {
  const parts = partsInET(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function selectCheckpoint(label, date = new Date()) {
  if (label !== "auto") return label;
  const parts = partsInET(date);
  const minuteOfDay = parts.hour * 60 + parts.minute;
  for (const [checkpoint, config] of Object.entries(CHECKPOINT_TIMES)) {
    const target = config.hour * 60 + config.minute;
    if (Math.abs(minuteOfDay - target) <= 30) return checkpoint;
  }
  return "heartbeat";
}

function checkpointDueNow(checkpoint, date = new Date()) {
  const parts = partsInET(date);
  const minuteOfDay = parts.hour * 60 + parts.minute;
  const config = CHECKPOINT_TIMES[checkpoint];
  const target = config.hour * 60 + config.minute;
  return Math.abs(minuteOfDay - target) <= 35;
}

function nextBusinessDayIso(referenceIso) {
  const current = new Date(`${referenceIso}T00:00:00Z`);
  current.setUTCDate(current.getUTCDate() + 1);
  while ([0, 6].includes(current.getUTCDay())) current.setUTCDate(current.getUTCDate() + 1);
  return current.toISOString().slice(0, 10);
}

function detectLanguage(...values) {
  const joined = values.filter(Boolean).join(" ").toLowerCase();
  return PORTUGUESE_HINTS.some((token) => joined.includes(token)) ? "pt" : "en";
}

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function writeJson(target, payload) {
  await ensureDir(path.dirname(target));
  await fs.writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function appendJsonl(target, payload) {
  await ensureDir(path.dirname(target));
  await fs.appendFile(target, `${JSON.stringify(payload)}\n`, "utf8");
}

class CloseClient {
  constructor(apiKey, baseUrl = DEFAULT_CLOSE_API_BASE) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    this.authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
  }

  async request(method, resourcePath, params = null, payload = null) {
    const url = new URL(resourcePath.replace(/^\//, ""), this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
      });
    }
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Close API ${method} ${url} failed: ${response.status} ${text}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  async listResource(resourcePath, params = {}) {
    const defaultLimit = resourcePath.startsWith("activity/") ? 100 : 200;
    const query = { ...params, _limit: params._limit || defaultLimit, _skip: params._skip || 0 };
    const rows = [];
    while (true) {
      const page = await this.request("GET", resourcePath, query);
      if (Array.isArray(page?.data)) {
        rows.push(...page.data);
        if (!page.has_more) break;
        query._skip += page.data.length;
        continue;
      }
      if (Array.isArray(page)) rows.push(...page);
      break;
    }
    return rows;
  }

  async getUsers() {
    return this.listResource("user/");
  }

  async findOwner(ownerName) {
    const normalizedTarget = ownerName.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const users = await this.getUsers();
    for (const user of users) {
      for (const candidate of [user.full_name, user.name, user.email, `${user.first_name || ""} ${user.last_name || ""}`.trim()]) {
        if (!candidate) continue;
        const normalizedCandidate = candidate.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        if (normalizedCandidate.includes(normalizedTarget)) return user;
      }
    }
    throw new Error(`Unable to find Close user matching owner "${ownerName}".`);
  }

  async getTasks(assignedToId) {
    const params = { _order_by: "date", is_complete: "false" };
    if (process.env.CLOSE_TASK_VIEW) params.view = process.env.CLOSE_TASK_VIEW;
    if (assignedToId) params.assigned_to = assignedToId;
    return this.listResource("task/", params);
  }

  async getLead(leadId) {
    return this.request("GET", `lead/${leadId}/`);
  }

  async searchLeads(query, limit = 10) {
    return this.listResource("lead/", { query, _limit: limit, _order_by: "date_updated" });
  }

  async getLeads(ownerName, ownerId, queryOverride) {
    const query = queryOverride || (ownerId ? `user_id:${ownerId}` : `"${ownerName}"`);
    return this.listResource("lead/", { query, _order_by: "date_updated" });
  }

  async getActivitiesForLead(leadId) {
    return this.listResource("activity/", { lead_id: leadId, _order_by: "date_created" });
  }

  async updateTaskDueDate(taskId, dueDate) {
    return this.request("PUT", `task/${taskId}/`, null, { date: dueDate });
  }

  async updateTask(taskId, payload) {
    return this.request("PUT", `task/${taskId}/`, null, payload);
  }

  async completeTask(taskId) {
    return this.updateTask(taskId, { is_complete: true });
  }

  async getConnectedAccounts() {
    return this.listResource("connected_account/");
  }

  async getPhoneNumbers() {
    return this.listResource("phone_number/");
  }

  async createEmailActivity(payload) {
    return this.request("POST", "activity/email/", null, payload);
  }

  async createSmsActivity(payload, sendToInbox = false) {
    return this.request("POST", "activity/sms/", sendToInbox ? { send_to_inbox: true } : null, payload);
  }
}

function normalizeOwnerName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function inferStage(lead) {
  for (const key of ["status_label", "lead_status_label", "stage", "status"]) {
    if (lead[key]) return String(lead[key]);
  }
  for (const opportunity of lead.opportunities || []) {
    if (opportunity.status_label || opportunity.status) return String(opportunity.status_label || opportunity.status);
  }
  return "Unknown";
}

function inferPipelineStatus(stage) {
  const lowered = stage.toLowerCase();
  if (/(won|closed)/.test(lowered)) return "closed";
  if (/(lost|dead|unqualified|archived)/.test(lowered)) return "stalled";
  if (/(proposal|quote|decision|contract|negotiat)/.test(lowered)) return "high_intent";
  return "active";
}

function extractCustomValueByHint(record, hints) {
  const entries = Object.entries(record.custom || {});
  for (const [key, value] of entries) {
    const normalizedKey = normalizeOwnerName(key);
    if (hints.some((hint) => normalizedKey.includes(normalizeOwnerName(hint)))) {
      if (Array.isArray(value)) return value.join(", ");
      return value == null ? null : String(value);
    }
  }
  return null;
}

function pickPrimaryOpportunity(lead) {
  const opportunities = [...(lead.opportunities || [])];
  opportunities.sort((left, right) => String(right.date_updated || right.date_created || "").localeCompare(String(left.date_updated || left.date_created || "")));
  return opportunities[0] || null;
}

function cleanStageLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isMessageActivity(activity) {
  const kind = String(activity.kind || "").toLowerCase();
  return kind === "email" || kind === "sms";
}

function includesAny(value, patterns) {
  return patterns.some((pattern) => value.includes(pattern));
}

function classifyLeadHeatSignal(leadStatus) {
  const normalized = normalizeOwnerName(leadStatus);
  if (includesAny(normalized, ["definitely not"])) return "definitely_not";
  if (includesAny(normalized, ["probably not"])) return "probably_not";
  if (includesAny(normalized, ["definitely"])) return "definitely";
  if (includesAny(normalized, ["probably"])) return "probably";
  if (includesAny(normalized, ["maybe"])) return "maybe";
  return "none";
}

function classifyOpportunitySignal(opportunityStatus) {
  const normalized = normalizeOwnerName(opportunityStatus);
  if (includesAny(normalized, ["booked tasting", "booked for tasting"])) return "booked_tasting";
  if (includesAny(normalized, ["setting tasting", "setting tasting appointment"])) return "setting_tasting";
  if (includesAny(normalized, ["qualified"])) return "qualified";
  return "none";
}

function tastingContext(lead, tastingWindows) {
  const blob = JSON.stringify(lead).toLowerCase();
  const booked = [
    "tasting booked",
    "degustação agendada",
    "scheduled tasting",
    "booked tasting",
  ].some((token) => blob.includes(token));
  return { tastingBooked: booked, nextTastingAt: tastingWindows[0] || null };
}

function leadMatchesOwner(lead, ownerName, ownerId) {
  const normalizedOwner = normalizeOwnerName(ownerName);
  if (ownerId) {
    if (lead.user_id === ownerId) return true;
    if (Array.isArray(lead.user_id) && lead.user_id.includes(ownerId)) return true;
  }
  const customOwner = (lead.custom || {})[DEFAULT_LEAD_OWNER_CUSTOM_FIELD];
  return [lead.owner_name, lead.user_name, lead.created_by_name, customOwner].some((candidate) =>
    normalizeOwnerName(candidate).includes(normalizedOwner),
  );
}

function normalizeActivity(rawActivity, ownerId, ownerName) {
  const incoming = rawActivity.direction === "incoming" || rawActivity.incoming === true;
  const ownerNormalized = normalizeOwnerName(ownerName);
  let direction = "inbound";
  if (incoming) direction = "inbound";
  else if (ownerId && rawActivity.user_id === ownerId) direction = "outbound";
  else if (normalizeOwnerName(rawActivity.user_name || rawActivity.created_by_name).includes(ownerNormalized)) direction = "outbound";
  return {
    id: rawActivity.id,
    kind: rawActivity.type || "activity",
    timestamp: rawActivity.date_created || rawActivity.date_sent || rawActivity.date || null,
    direction,
    subject: rawActivity.subject || rawActivity.status || "",
    body: (rawActivity.body_text || rawActivity.body || rawActivity.snippet || "").trim(),
  };
}

function buildLeadSignals(snapshot, ownerName, ownerId, tastingWindows) {
  const tasksByLead = new Map();
  for (const rawTask of snapshot.tasks || []) {
    const assignedTo = rawTask.assigned_to_name || rawTask.assigned_to || rawTask.user_name;
    const assignedId = rawTask.assigned_to_id || rawTask.assigned_to || rawTask.user_id;
    if (ownerId && assignedId && assignedId !== ownerId) continue;
    if (assignedTo && !normalizeOwnerName(assignedTo).includes(normalizeOwnerName(ownerName))) continue;
    if (rawTask.is_complete) continue;
    const dueDate = rawTask.due_date || rawTask.date || null;
    const normalized = {
      id: rawTask.id,
      text: (rawTask.text || rawTask.description || "Follow up").trim(),
      dueDate: dueDate ? String(dueDate).slice(0, 10) : null,
      assignedTo: assignedTo || null,
    };
    if (!tasksByLead.has(rawTask.lead_id)) tasksByLead.set(rawTask.lead_id, []);
    tasksByLead.get(rawTask.lead_id).push(normalized);
  }

  const activitiesByLead = new Map();
  for (const rawActivity of snapshot.activities || []) {
    if (!rawActivity.lead_id) continue;
    const normalized = normalizeActivity(rawActivity, ownerId, ownerName);
    if (!activitiesByLead.has(rawActivity.lead_id)) activitiesByLead.set(rawActivity.lead_id, []);
    activitiesByLead.get(rawActivity.lead_id).push(normalized);
  }

  const todayIso = todayEtIso();
  const results = [];
  for (const lead of snapshot.leads || []) {
    const leadTasks = tasksByLead.get(lead.id) || [];
    if (!leadMatchesOwner(lead, ownerName, ownerId) && leadTasks.length === 0) continue;

    const activities = (activitiesByLead.get(lead.id) || []).sort((left, right) => String(right.timestamp).localeCompare(String(left.timestamp)));
    const messageActivities = activities.filter(isMessageActivity);
    const lastActivity = activities[0] || null;
    const lastInbound = messageActivities.find((activity) => activity.direction === "inbound") || null;
    const lastOutbound = messageActivities.find((activity) => activity.direction === "outbound") || null;
    const recentInboundMessages = messageActivities
      .filter((activity) => activity.direction === "inbound")
      .slice(0, 3)
      .map((activity) => ({
        id: activity.id,
        kind: activity.kind,
        timestamp: activity.timestamp,
        subject: activity.subject,
        body: activity.body,
        answered: messageActivities.some(
          (candidate) => candidate.direction === "outbound" && String(candidate.timestamp) > String(activity.timestamp),
        ),
      }));
    const overdueTasks = leadTasks.filter((task) => task.dueDate && task.dueDate < todayIso);
    const lastTouch = lastActivity?.timestamp ? new Date(lastActivity.timestamp) : null;
    const daysSinceTouch = lastTouch ? Math.max(Math.floor((Date.now() - lastTouch.getTime()) / 86400000), 0) : null;
    let unansweredOutboundCount = 0;
    if (lastOutbound) {
      for (const activity of activities) {
        if (activity.direction === "outbound") unansweredOutboundCount += 1;
        if (activity.direction === "inbound") break;
      }
    }
    const { tastingBooked, nextTastingAt } = tastingContext(lead, tastingWindows);
    const primaryOpportunity = pickPrimaryOpportunity(lead);
    const leadStatus = cleanStageLabel(lead.status_label || "");
    const opportunityStatus = cleanStageLabel(primaryOpportunity?.status_label || primaryOpportunity?.status_display_name || "");
    const cadenceStep = extractCustomValueByHint(lead, ["7 tp cadence", "7 t cadence", "cadence follow up", "cadence"]);
    const leadOwnerLabel = extractCustomValueByHint(lead, ["lead owner"]) || lead.owner_name || lead.user_name || ownerName;
    const hasUnansweredInbound = recentInboundMessages.some((message) => !message.answered);
    results.push({
      leadId: lead.id,
      leadName: lead.display_name || lead.name || "Unknown lead",
      ownerId: lead.owner_id || lead.user_id || ownerId || null,
      ownerName: leadOwnerLabel,
      stage: inferStage(lead),
      leadStatus,
      opportunityStatus,
      cadenceStep,
      pipelineStatus: inferPipelineStatus(opportunityStatus || inferStage(lead)),
      lastActivity,
      lastInbound,
      lastOutbound,
      recentInboundMessages,
      openTasks: leadTasks.sort((left, right) => String(left.dueDate || "9999-12-31").localeCompare(String(right.dueDate || "9999-12-31"))),
      overdueTasks,
      tastingBooked,
      nextTastingAt,
      language: detectLanguage(lead.language, lead.locale, lastInbound?.body, lastInbound?.subject),
      daysSinceTouch,
      unansweredOutboundCount,
      repliesOwed: hasUnansweredInbound && Boolean(lastInbound && !recentInboundMessages[0]?.answered),
      hasUnansweredInbound,
      followUpDue:
        overdueTasks.length > 0 ||
        Boolean(lastOutbound?.timestamp && (Date.now() - new Date(lastOutbound.timestamp).getTime()) >= 2 * 86400000) ||
        Boolean(daysSinceTouch !== null && daysSinceTouch >= 5 && !tastingBooked),
      hasRecentEngagement: daysSinceTouch !== null && daysSinceTouch <= 3,
    });
  }
  return results;
}

function scoreLead(signals) {
  let score = 0;
  const rationale = [];
  let communicationStatus = "no_recent_activity";
  const leadStatus = normalizeOwnerName(signals.leadStatus);
  const opportunityStatus = normalizeOwnerName(signals.opportunityStatus);
  const leadHeat = classifyLeadHeatSignal(signals.leadStatus);
  const opportunityHeat = classifyOpportunitySignal(signals.opportunityStatus);

  if (signals.repliesOwed) {
    score += 45;
    communicationStatus = "lead_waiting_on_andre";
    rationale.push("Lead sent the latest message and Andre owes a reply.");
  } else if (signals.hasUnansweredInbound) {
    score += 35;
    communicationStatus = "older_inbound_needs_review";
    rationale.push("There are inbound lead messages in the last 3 touches that still need reply awareness.");
  } else if (signals.followUpDue) {
    score += 20;
    communicationStatus = "andre_waiting_on_lead";
    rationale.push("Andre has a proactive follow-up due.");
  } else if (signals.hasRecentEngagement) {
    score += 10;
    communicationStatus = "active_back_and_forth";
    rationale.push("Conversation is active but not urgent yet.");
  }

  if (leadHeat === "definitely") {
    score += 35;
    rationale.push("Lead status is Definitely, which you treat as hot.");
  } else if (leadHeat === "probably") {
    score += 16;
    rationale.push("Lead status is Probably, which you treat as warm/hot.");
  } else if (leadHeat === "maybe") {
    score += 4;
    rationale.push("Lead status is Maybe, so it stays active but below hot.");
  } else if (leadHeat === "probably_not") {
    score -= 8;
    rationale.push("Lead status is Probably Not, so it should not inflate hot priority by itself.");
  } else if (leadHeat === "definitely_not") {
    score -= 18;
    rationale.push("Lead status is Definitely Not, so it should stay out of the hot queue unless the conversation changes.");
  }

  if (opportunityHeat === "booked_tasting") {
    score += 60;
    rationale.push("Opportunity is at Booked Tasting, which is hottest priority.");
  } else if (opportunityHeat === "setting_tasting") {
    score += 50;
    rationale.push("Opportunity is at Setting Tasting, which is high urgency.");
  } else if (opportunityHeat === "qualified") {
    score += 20;
    rationale.push("Opportunity is Qualified, which is warm/hot by your standard.");
  }

  if (signals.pipelineStatus === "high_intent") {
    score += 25;
    rationale.push("Pipeline stage indicates high purchase intent.");
  } else if (signals.pipelineStatus === "active") {
    score += 6;
    rationale.push("Lead remains active in the pipeline.");
  } else if (signals.pipelineStatus === "closed") {
    score -= 16;
    rationale.push("Pipeline stage is closed, so it should only stay active if there is a deliberate task to handle.");
  } else if (signals.pipelineStatus === "stalled") {
    score -= 14;
    rationale.push("Pipeline stage indicates stalled momentum.");
  }

  if (signals.overdueTasks.length > 0) {
    score += Math.min(14, signals.overdueTasks.length * 7);
    rationale.push("There are overdue Close tasks attached to this lead.");
  }
  if (signals.daysSinceTouch !== null) {
    if (signals.daysSinceTouch <= 1) {
      score += 12;
      rationale.push("There was human touch in the last 24 hours.");
    } else if (signals.daysSinceTouch <= 3) {
      score += 6;
      rationale.push("The lead has been touched recently.");
    } else if (signals.daysSinceTouch >= 14) {
      score -= 10;
      rationale.push("The lead has gone stale for two weeks or more.");
    }
  }
  if (signals.unansweredOutboundCount >= 2) {
    score -= 12;
    rationale.push("Recent outbound attempts have gone unanswered multiple times.");
  }
  if (
    signals.hasRecentEngagement &&
    !signals.tastingBooked &&
    (opportunityHeat === "qualified" || opportunityHeat === "setting_tasting" || leadHeat === "definitely" || leadHeat === "probably")
  ) {
    score += 10;
    rationale.push("Lead is engaged and still missing a tasting invitation.");
  }

  let statusBucket = score >= 70 ? "Hot" : score >= 30 ? "Warm" : "Cold";
  if (opportunityHeat === "booked_tasting" || opportunityHeat === "setting_tasting") statusBucket = "Hot";
  else if (leadHeat === "definitely" && (opportunityHeat === "qualified" || signals.repliesOwed || signals.followUpDue)) statusBucket = "Hot";
  else if ((leadHeat === "probably" || opportunityHeat === "qualified") && statusBucket === "Cold") statusBucket = "Warm";
  return { score, statusBucket, rationale, communicationStatus };
}

function recommendedActionFor(signals, statusBucket, checkpoint) {
  const artifactMode = "draft only";
  const leadHeat = classifyLeadHeatSignal(signals.leadStatus);
  const opportunityHeat = classifyOpportunitySignal(signals.opportunityStatus);
  if (checkpoint === "eod" && signals.overdueTasks.length > 0) return { action: "roll", artifactMode };
  if (signals.repliesOwed) return { action: "reply", artifactMode };
  if (opportunityHeat === "booked_tasting") return { action: "confirm tasting", artifactMode };
  if (
    !signals.tastingBooked &&
    (
      opportunityHeat === "setting_tasting" ||
      opportunityHeat === "qualified" ||
      leadHeat === "definitely" ||
      leadHeat === "probably"
    )
  ) return { action: "invite to tasting", artifactMode };
  if (statusBucket === "Cold") return { action: "reactivate", artifactMode };
  if (signals.followUpDue) return { action: "follow up", artifactMode };
  return { action: "wait", artifactMode };
}

function buildDraft(signals, action) {
  const firstName = signals.leadName.split(" ")[0];
  const tastingReference = signals.nextTastingAt || "Sunday, March 29 at 2:00 PM";
  const phoneOrTasting = "Would it be better to jump on a quick call, or should I save you a spot for our tasting on Sunday, March 29 at 2:00 PM?";
  if (signals.language === "pt") {
    if (action === "reply") {
      return {
        draftSubject: `Rascunho de resposta para ${signals.leadName}`,
        draftBody:
          `Oi ${firstName}, vi suas últimas mensagens e queria responder com clareza.\n\n` +
          "O que está mais importante para você resolver agora?\n" +
          "Faz mais sentido fazermos uma ligação rápida ou eu separar um lugar para você na degustação de domingo, 29 de março, às 2:00 PM?\n\n" +
          "André",
      };
    }
    if (action === "invite to tasting") {
      return {
        draftSubject: `Convite de degustação para ${signals.leadName}`,
        draftBody:
          `Oi ${firstName}, pelo que conversamos, acho que faz sentido te convidar para ${tastingReference}.\n\n` +
          "O que você precisa sentir ou validar nessa degustação para ter clareza do próximo passo?\n" +
          "Se quiser, eu separo um horário e te mando os detalhes.\n\n" +
          "André",
      };
    }
    if (action === "confirm tasting") {
      return {
        draftSubject: `Confirmar degustação com ${signals.leadName}`,
        draftBody:
          `Oi ${firstName}, quero confirmar sua presença na degustação de domingo, 29 de março, às 2:00 PM.\n\n` +
          "O que você quer sentir ou esclarecer nessa degustação para avançarmos com segurança?\n" +
          "Se preferir, também podemos alinhar isso numa ligação rápida antes.\n\n" +
          "André",
      };
    }
    if (action === "reactivate") {
      return {
        draftSubject: `Reativação de conversa com ${signals.leadName}`,
        draftBody:
          `Oi ${firstName}, queria retomar nossa conversa com uma pergunta rápida.\n\n` +
          "O que mudou do seu lado desde a última vez que falamos?\n" +
          "Faz mais sentido uma ligação rápida ou te convidar para a degustação de domingo, 29 de março, às 2:00 PM?\n\n" +
          "André",
      };
    }
    return {
      draftSubject: `Follow-up para ${signals.leadName}`,
      draftBody:
        `Oi ${firstName}, passando para acompanhar.\n\n` +
        "O que ainda está pendente para você decidir o próximo passo?\n" +
        "Faz mais sentido uma ligação rápida ou te separar um lugar na degustação de domingo, 29 de março, às 2:00 PM?\n\n" +
        "André",
    };
  }

  if (action === "reply") {
    return {
      draftSubject: `Reply draft for ${signals.leadName}`,
      draftBody:
        `Hi ${firstName}, I went through your recent messages and wanted to respond clearly.\n\n` +
        "What feels most important for you to get clarity on right now?\n" +
        `${phoneOrTasting}\n\n` +
        "Andre",
    };
  }
  if (action === "invite to tasting") {
    return {
      draftSubject: `Tasting invitation for ${signals.leadName}`,
      draftBody:
        `Hi ${firstName}, based on where things stand, I think the best next step is to get you into ${tastingReference}.\n\n` +
        "What would you want to experience or confirm in that tasting so you can feel confident moving forward?\n" +
        "If you want, I can hold a spot and send the details.\n\n" +
        "Andre",
    };
  }
  if (action === "confirm tasting") {
    return {
      draftSubject: `Tasting confirmation for ${signals.leadName}`,
      draftBody:
        `Hi ${firstName}, I want to confirm your spot for our tasting on Sunday, March 29 at 2:00 PM.\n\n` +
        "What do you most want to experience or validate at the tasting so you can feel good about the next step?\n" +
        "If it helps, we can also do a quick call before then.\n\n" +
        "Andre",
    };
  }
  if (action === "reactivate") {
    return {
      draftSubject: `Reactivation draft for ${signals.leadName}`,
      draftBody:
        `Hi ${firstName}, I wanted to circle back with one quick question.\n\n` +
        "What changed on your side since we last spoke?\n" +
        `${phoneOrTasting}\n\n` +
        "Andre",
    };
  }
  return {
    draftSubject: `Follow-up draft for ${signals.leadName}`,
    draftBody:
      `Hi ${firstName}, checking in to keep things moving.\n\n` +
      "What is the main thing you still need to see or solve before taking the next step?\n" +
      `${phoneOrTasting}\n\n` +
      "Andre",
  };
}

function buildRecommendations(signalsList, checkpoint) {
  return signalsList
    .map((signals) => {
      const { score, statusBucket, rationale, communicationStatus } = scoreLead(signals);
      const { action, artifactMode } = recommendedActionFor(signals, statusBucket, checkpoint);
      const { draftSubject, draftBody } = buildDraft(signals, action);
      let nextStepDue = null;
      if (action === "roll") nextStepDue = nextBusinessDayIso(todayEtIso());
      else if (signals.openTasks[0]?.dueDate) nextStepDue = signals.openTasks[0].dueDate;
      else if (signals.nextTastingAt) nextStepDue = signals.nextTastingAt;
      return {
        leadId: signals.leadId,
        leadName: signals.leadName,
        statusBucket,
        score,
        communicationStatus,
        recommendedAction: action,
        rationale,
        language: signals.language,
        artifactMode,
        draftSubject,
        draftBody,
        lastTouchAt: signals.lastActivity?.timestamp || null,
        nextStepDue,
        auditStatus: action === "wait" ? "skipped" : action === "roll" ? "rolled" : "drafted",
        checkpoint,
        tastingInvite: action === "invite to tasting",
        stage: signals.stage,
        leadStatus: signals.leadStatus,
        opportunityStatus: signals.opportunityStatus,
        cadenceStep: signals.cadenceStep,
        recentInboundMessages: signals.recentInboundMessages,
      };
    })
    .sort((left, right) => right.score - left.score || left.leadName.localeCompare(right.leadName));
}

function normalizeHumanName(value) {
  return normalizeOwnerName(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function parseGuestRangeFromLead(lead) {
  const sources = [lead.description, latestOpportunity(lead)?.note, JSON.stringify(lead.custom || {})].filter(Boolean);
  for (const source of sources) {
    const text = String(source);
    const rangeMatch = text.match(/\b(\d{1,3})\s*-\s*(\d{1,3})\b/);
    if (rangeMatch) return { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) };
    const labeledMatch = text.match(/\b(?:people|guest count|estimated guest count)\s*[:=]?\s*(\d{1,3})\b/i);
    if (labeledMatch) {
      const value = Number(labeledMatch[1]);
      return { min: value, max: value };
    }
  }
  return null;
}

function parseEventTypeFromLead(lead) {
  const lines = String(lead.description || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const labeled = lines.find((line) => /^event desc\s*:/i.test(line));
  if (labeled) {
    const value = labeled.replace(/^event desc\s*:/i, "").trim();
    if (value) return value;
  }
  return lines.find((line) => /birthday|wedding|corporate|graduation|baby shower|bridal shower|party|anniversary/i.test(line)) || null;
}

function parseEventDateFromLead(lead) {
  const opportunity = latestOpportunity(lead);
  const description = String(lead.description || "");
  const labeledMatch = description.match(/\bEvent Date\s*:\s*([^\n\r]+)/i);
  const customDate =
    lead.custom?.["Date of Event"] ||
    opportunity?.["custom.cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP"] ||
    opportunity?.custom?.cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP;
  const raw = customDate || labeledMatch?.[1]?.trim() || opportunity?.date_created || null;
  if (!raw) return null;
  const slashDateMatch = String(raw).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashDateMatch) {
    const month = Number(slashDateMatch[1]);
    const day = Number(slashDateMatch[2]);
    const year = Number(slashDateMatch[3].length === 2 ? `20${slashDateMatch[3]}` : slashDateMatch[3]);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
}

function normalizeQuoteGuestCounts(value, inferredRange) {
  if (value) {
    return [...new Set(String(value).split(",").map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0))].sort((a, b) => a - b);
  }
  if (inferredRange?.min && inferredRange?.max) {
    return [Math.max(inferredRange.min, inferredRange.max)];
  }
  return [30];
}

function parseQuoteTier(rawTier) {
  const [name, price, description] = String(rawTier).split("|").map((item) => item.trim());
  if (!name || !price || !description) {
    throw new Error(`Invalid --quote-tier "${rawTier}". Use Name|price|description.`);
  }
  const priceNumber = Number(price);
  if (!Number.isFinite(priceNumber)) {
    throw new Error(`Invalid quote tier price in "${rawTier}".`);
  }
  return { name, pricePerPerson: priceNumber, description };
}

function serviceChargeForGuests(guests, serviceStyle) {
  const normalized = String(serviceStyle || "buffet").toLowerCase();
  if (normalized === "plated" || normalized === "family") return guests * 3;
  if (guests <= 50) return 150;
  return guests * 3;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function calculatorButtonHtml() {
  return `<div style="text-align:center;margin:24px 0 22px;">
    <a href="${COMEKETO_CALCULATOR_URL}" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:18px;">🔥 Comeketo Calculator</a>
  </div>`;
}

function signatureHtml() {
  return `<p style="margin:18px 0 0;">Regards,<br>Andre Raw<br>\u200b\u200bCatering Event Coordinator<br>📲 C: (978) 235-3791<br>📲 W: (978) 381-1212<br>Facebook | Instagram | Website</p>`;
}

function buildBallparkQuoteHtml({ firstName, introLine, quoteTone, serviceStyle, tiers, quoteDetails }) {
  const optionIcons = ["🔥", "🍽️", "🌟", "✨"];
  const optionNames = ["Brazilian BBQ (Churrasco)", "Deluxe Churrasco", "Custom Option", "Option"];
  const optionTaglines = [
    "On-site grilling with our team — the real deal!",
    "A fuller spread with one extra protein for more variety.",
    "A more customized path depending on what you want to highlight.",
    "A strong option to get you moving in the right direction.",
  ];
  const makeItYourOwn = quoteTone === "fun"
    ? `<div style="margin:18px 0;">
        <p style="margin:0 0 8px;font-size:24px;"><span style="font-size:22px;">🌟</span> <strong>Make It Your Own!</strong></p>
        <ul style="margin:8px 0 14px 22px;padding:0;">
          <li>🧀 Appetizers — available to add on</li>
          <li>🍰 Desserts — available to add on</li>
          <li>🥩 Extra proteins and sides — available to customize</li>
          <li>🔗 You can also explore options directly in our interactive calculator</li>
        </ul>
        <p style="margin:0;color:#666;">These are ballpark numbers to give you a feel — once you pick a style and tell us what you are craving, we will dial it in perfectly.</p>
      </div>`
    : "";

  const blocks = quoteDetails.map((detail, index) => {
    const icon = optionIcons[index] || "✨";
    const optionName = optionNames[index] || `Option ${index + 1}`;
    const tagline = optionTaglines[index] || optionTaglines[optionTaglines.length - 1];
    const tier = detail.tier;
    return `<div style="margin:0 0 22px;">
      <p style="margin:0 0 8px;font-size:24px;"><span style="font-size:22px;">${icon}</span> <strong>Option ${index + 1} — ${escapeHtml(optionName)}</strong></p>
      <p style="margin:0 0 12px;color:#555;"><em>${escapeHtml(tagline)}</em></p>
      <table style="border-collapse:collapse;width:100%;margin:0 0 10px;">
        <tr>
          <td style="border:1px solid #ddd;padding:10px;font-weight:700;background:#fafafa;">${escapeHtml(tier.name)}</td>
          <td style="border:1px solid #ddd;padding:10px;background:#fafafa;">${escapeHtml(tier.description)}</td>
          <td style="border:1px solid #ddd;padding:10px;font-weight:700;background:#fafafa;">${escapeHtml(formatMoney(tier.pricePerPerson))}/person</td>
        </tr>
        <tr>
          <td colspan="2" style="border:1px solid #ddd;padding:10px;">Estimated Total (${detail.guests} guests)</td>
          <td style="border:1px solid #ddd;padding:10px;font-weight:700;">~${escapeHtml(formatMoney(Math.round(detail.total)))}</td>
        </tr>
      </table>
      <div style="margin:10px 0 0 2px;color:#444;">
        <div><strong>Food:</strong> ${escapeHtml(formatMoney(tier.pricePerPerson))} x ${detail.guests} = ${escapeHtml(formatMoney(detail.foodSubtotal))}</div>
        <div><strong>Appetizers:</strong> ${escapeHtml(formatMoney(detail.appetizerPp))} x ${detail.guests} = ${escapeHtml(formatMoney(detail.appetizerSubtotal))}</div>
        <div><strong>MA Tax (7%):</strong> ${escapeHtml(formatMoney(detail.tax))}</div>
        <div><strong>Service, Fuel &amp; Admin (24%):</strong> ${escapeHtml(formatMoney(detail.admin))}</div>
        <div><strong>${escapeHtml(detail.serviceLabel)}:</strong> ${escapeHtml(formatMoney(detail.serviceCharge))}</div>
        <div><strong>Ballpark Total:</strong> ~${escapeHtml(formatMoney(detail.total))}</div>
      </div>
    </div>`;
  }).join("");

  const closeText = quoteTone === "fun"
    ? `<p style="margin:16px 0 0;">For the meats, our default steak is <strong>Top Sirloin</strong> and our default chicken is <strong>Chicken Wrapped in Bacon</strong> 🔥</p>
       <p style="margin:8px 0 0;">Complimentary cookies are included too 🍪</p>
       <p style="margin:18px 0 0;">These are ballpark numbers so I can point you in the right direction without leading you the wrong way before we lock in your final guest count, menu, and service details 😊</p>
       <p style="margin:14px 0 0;">Which option feels more like your vibe for the event?</p>
       <p style="margin:8px 0 0;">Once you tell me where you think the guest count will land and which tier feels right, I can tighten this ballpark into the best next version for you 😊</p>`
    : `<p style="margin:16px 0 0;">For the meats, our default steak is <strong>Top Sirloin</strong> and our default chicken is <strong>Chicken Wrapped in Bacon</strong>.</p>
       <p style="margin:8px 0 0;">Complimentary cookies are included.</p>
       <p style="margin:18px 0 0;">These are ballpark numbers so I can point you in the right direction without leading you the wrong way before we lock in your final guest count, menu, and service details.</p>
       <p style="margin:14px 0 0;">Which option feels closer to what you want for the event?</p>`;

  return `<div style="font-family:Arial, Helvetica, sans-serif;color:#222;line-height:1.5;max-width:720px;">
    <p style="margin:0 0 16px;">Hi ${escapeHtml(firstName)}!</p>
    <p style="margin:0 0 18px;">${escapeHtml(introLine)}</p>
    <p style="margin:0 0 10px;">I wanted to make this easy to look at, so below are a couple of ballpark options from <strong>Comeketo Catering</strong> 🍽️</p>
    <p style="margin:0 0 18px;">I used our Comeketo food calculator as the starting point so these numbers stay grounded in the same pricing logic we use internally.</p>
    ${blocks}
    ${makeItYourOwn}
    ${calculatorButtonHtml()}
    ${closeText}
    ${signatureHtml()}
  </div>`;
}

function buildBallparkQuoteEmail(lead, options = {}) {
  const firstName = (lead.display_name || "there").split(" ")[0];
  const inferredRange = parseGuestRangeFromLead(lead);
  const guestCounts = normalizeQuoteGuestCounts(options.quoteGuests, inferredRange);
  const eventType = options.quoteEventType || parseEventTypeFromLead(lead) || "event";
  const eventDate = options.quoteDate || parseEventDateFromLead(lead);
  const appetizerPp = Number(options.quoteAppetizersPp || 0);
  const serviceStyle = options.quoteServiceStyle || "buffet";
  const quoteTone = String(options.quoteTone || "default").toLowerCase();
  const tiers = (options.quoteTiers || []).map(parseQuoteTier);
  if (!tiers.length) {
    throw new Error("Quote mode requires at least one --quote-tier using Name|price|description.");
  }

  const introLine = quoteTone === "fun"
    ? eventDate
      ? `I put together a fun ballpark for your ${eventType.toLowerCase()} on ${eventDate} ${eventType.toLowerCase() === "birthday" ? "🎉" : "✨"}`
      : `I put together a fun ballpark for your ${eventType.toLowerCase()} ✨`
    : eventDate
      ? `Thanks again for reaching out about your ${eventType.toLowerCase()} on ${eventDate}.`
      : `Thanks again for reaching out about your ${eventType.toLowerCase()}.`;

  const lines = quoteTone === "fun"
    ? [
        `Hi ${firstName}!`,
        "",
        introLine,
        "I wanted to make this easy to look at, so below are a couple of ballpark options from Comeketo Catering 🍽️",
        "I used our Comeketo food calculator as the starting point so these numbers stay grounded in the same pricing logic we use internally.",
        `You can also take a look here: Comeketo Catering Interactive Menu and Price Calculator\n${COMEKETO_CALCULATOR_URL}`,
        "",
        "These are ballpark numbers so I can point you in the right direction without leading you the wrong way before we lock in your final guest count, menu, and service details 😊",
        "",
      ]
    : [
        `Hi ${firstName},`,
        "",
        introLine,
        "Based on the details I have so far, here are a few ballpark options from Comeketo Catering.",
        "I used our Comeketo food calculator as the starting point so these numbers stay grounded in the same pricing logic we use internally.",
        `You can also take a look here: Comeketo Catering Interactive Menu and Price Calculator\n${COMEKETO_CALCULATOR_URL}`,
        "",
        "These are ballpark numbers so I can point you in the right direction without leading you the wrong way before we lock in your final guest count, menu, and service details.",
        "",
      ];

  const quoteDetails = [];
  for (const tier of tiers) {
    lines.push(tier.name);
    lines.push(tier.description);
    lines.push(`Base food price: ${formatMoney(tier.pricePerPerson)} per person`);
    lines.push("");
    for (const guests of guestCounts) {
      const foodSubtotal = tier.pricePerPerson * guests;
      const appetizerSubtotal = appetizerPp * guests;
      const subtotal = foodSubtotal + appetizerSubtotal;
      const tax = subtotal * 0.07;
      const admin = subtotal * 0.24;
      const serviceCharge = serviceChargeForGuests(guests, serviceStyle);
      const total = subtotal + tax + admin + serviceCharge;
      const serviceLabel =
        serviceStyle === "plated" || serviceStyle === "family"
          ? `Service Charge (${serviceStyle} service at $3/pp)`
          : guests <= 50
            ? "Service Charge (50 guests or fewer)"
            : "Service Charge (over 50 guests at $3/pp)";
      quoteDetails.push({
        tier,
        guests,
        appetizerPp,
        foodSubtotal,
        appetizerSubtotal,
        subtotal,
        tax,
        admin,
        serviceCharge,
        total,
        serviceLabel,
      });
      lines.push(`${tier.name} (${guests} guests)`);
      lines.push(`Food: ${formatMoney(tier.pricePerPerson)} x ${guests} = ${formatMoney(foodSubtotal)}`);
      lines.push(`Appetizers: ${formatMoney(appetizerPp)} x ${guests} = ${formatMoney(appetizerSubtotal)}`);
      lines.push(`MA Tax (7%): ${formatMoney(tax)}`);
      lines.push(`Service, Fuel & Admin (24%): ${formatMoney(admin)}`);
      lines.push(`${serviceLabel}: ${formatMoney(serviceCharge)}`);
      lines.push(`Ballpark Total: ~${formatMoney(total)}`);
      lines.push("");
    }
  }

  if (quoteTone === "fun") {
    lines.push("For the meats, our default steak is Top Sirloin and our default chicken is Chicken Wrapped in Bacon 🔥");
    lines.push("Complimentary cookies are included too 🍪");
    lines.push("");
    lines.push("Which option feels more like your vibe for the event?");
    lines.push("Once you tell me where you think the guest count will land and which tier feels right, I can tighten this ballpark into the best next version for you 😊");
  } else {
    lines.push("For the meats, our default steak is Top Sirloin and our default chicken is Chicken Wrapped in Bacon.");
    lines.push("Complimentary cookies are included.");
    lines.push("");
    lines.push("Which option feels closer to what you want for the event?");
    lines.push("Once you tell me the guest count you expect to land on and which direction feels right, I can tighten this ballpark into the right next version for you.");
  }
  lines.push("");
  const body = appendEmailSignature(lines.join("\n"));
  const bodyHtml = buildBallparkQuoteHtml({
    firstName,
    introLine,
    quoteTone,
    serviceStyle,
    tiers,
    quoteDetails,
  });

  const subjectDate = eventDate ? ` for ${eventDate}` : "";
  return {
    subject: options.subject || (quoteTone === "fun" ? `Fun ballpark quote${subjectDate} 🎉` : `Ballpark quote${subjectDate}`),
    body,
    bodyHtml,
    tiers,
    guestCounts,
  };
}

function safeHostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function businessEmailsForLead(lead) {
  const emails = [];
  for (const contact of lead.contacts || []) {
    for (const item of contact.emails || []) {
      if (!item.email) continue;
      const email = String(item.email).toLowerCase();
      const domain = email.split("@")[1] || "";
      if (!domain || SMARTLIST_FREE_EMAIL_DOMAINS.has(domain) || SMARTLIST_JUNK_RE.test(domain)) continue;
      emails.push(email);
    }
  }
  return [...new Set(emails)];
}

function latestOpportunity(lead) {
  const opportunities = [...(lead.opportunities || [])];
  opportunities.sort((left, right) => String(right.date_updated || right.date_created || "").localeCompare(String(left.date_updated || left.date_created || "")));
  return opportunities[0] || null;
}

function includeInSmartList(lead) {
  const leadName = String(lead.display_name || lead.name || "");
  if (!leadName || SMARTLIST_BAD_LEAD_RE.test(leadName)) return false;
  const leadStatus = `${lead.status_label || ""} ${lead.status || ""}`;
  const opportunityBlob = (lead.opportunities || []).map((item) => `${item.status_label || ""} ${item.status_type || ""} ${item.note || ""}`).join(" ");
  if (SMARTLIST_WON_RE.test(leadStatus) || SMARTLIST_WON_RE.test(opportunityBlob)) return false;
  if (SMARTLIST_DEAD_RE.test(leadStatus) || SMARTLIST_DEAD_RE.test(opportunityBlob)) return false;
  if (/internal lead/i.test(leadStatus)) return false;
  const emails = businessEmailsForLead(lead);
  const website = String(lead.url || "");
  const companyLike = SMARTLIST_COMPANY_RE.test(leadName);
  const hasWebsite = website && !SMARTLIST_JUNK_RE.test(website);
  return companyLike || emails.length > 0 || hasWebsite;
}

function smartListCategory(lead) {
  const text = `${lead.display_name || lead.name || ""} ${lead.url || ""} ${businessEmailsForLead(lead).join(" ")}`;
  if (SMARTLIST_PAINTING_RE.test(text)) return "Painting / Home Services";
  if (SMARTLIST_VENUE_RE.test(text)) return "Venues / Event Companies";
  return "Other Companies";
}

function smartListPriority(lead) {
  const leadStatus = cleanStageLabel(lead.status_label || lead.status || "");
  const opportunityStatus = cleanStageLabel(latestOpportunity(lead)?.status_label || latestOpportunity(lead)?.status_type || "");
  let score = 0;
  const leadHeat = classifyLeadHeatSignal(leadStatus);
  const opportunityHeat = classifyOpportunitySignal(opportunityStatus);
  if (leadHeat === "definitely") score += 35;
  else if (leadHeat === "probably") score += 24;
  else if (leadHeat === "maybe") score += 12;
  if (opportunityHeat === "booked_tasting") score += 50;
  else if (opportunityHeat === "setting_tasting") score += 40;
  else if (opportunityHeat === "qualified") score += 20;
  if (/(considering|aware of us|prospect|open)/i.test(opportunityStatus)) score += 10;
  const updatedAt = new Date(lead.date_updated || lead.date_created || Date.now()).getTime();
  const ageDays = Math.max(Math.floor((Date.now() - updatedAt) / 86400000), 0);
  if (ageDays <= 7) score += 15;
  else if (ageDays <= 21) score += 8;
  else if (ageDays >= 60) score -= 8;
  return score;
}

function smartListNextStep(lead, category) {
  const leadStatus = cleanStageLabel(lead.status_label || lead.status || "");
  const opportunity = latestOpportunity(lead);
  const opportunityStatus = cleanStageLabel(opportunity?.status_label || opportunity?.status_type || "");
  const emails = businessEmailsForLead(lead);
  if (/qualified|considering|aware of us|open/i.test(opportunityStatus)) return "Send tailored NEPQ email, then call within 2 business days";
  if (category === "Painting / Home Services") return emails.length ? "Research fit and send a preferred-vendor intro email" : "Research the company and find a direct business email first";
  if (emails.length > 0 && /maybe|probably/i.test(leadStatus)) return "Send NEPQ intro email and ask for a 10-minute vendor call";
  if (emails.length > 0) return "Research lightly, then send a preferred-vendor intro email";
  if (lead.url) return "Research the website and find a direct contact before outreach";
  return "Needs cleanup before outreach";
}

function buildSmartList(leads, ownerName) {
  const items = leads
    .filter(includeInSmartList)
    .map((lead) => {
      const opportunity = latestOpportunity(lead);
      const category = smartListCategory(lead);
      return {
        leadId: lead.id,
        leadName: lead.display_name || lead.name || "Unknown lead",
        ownerName: extractCustomValueByHint(lead, ["lead owner"]) || lead.owner_name || lead.user_name || "Unassigned",
        leadStatus: cleanStageLabel(lead.status_label || lead.status || ""),
        opportunityStatus: cleanStageLabel(opportunity?.status_label || opportunity?.status_type || "") || "No opportunity",
        website: lead.url || "",
        businessEmails: businessEmailsForLead(lead).slice(0, 3),
        category,
        updatedAt: lead.date_updated || lead.date_created || null,
        priorityScore: smartListPriority(lead),
        nextStep: smartListNextStep(lead, category),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore || String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")) || left.leadName.localeCompare(right.leadName));

  const groups = {
    "Painting / Home Services": [],
    "Venues / Event Companies": [],
    "Other Companies": [],
  };
  for (const item of items) groups[item.category].push(item);
  return {
    generated_at: isoNow(),
    owner: ownerName,
    summary: {
      total: items.length,
      painting: groups["Painting / Home Services"].length,
      venues: groups["Venues / Event Companies"].length,
      other: groups["Other Companies"].length,
    },
    top_priority: items.slice(0, 25),
    groups,
  };
}

function renderSmartListMarkdown(report) {
  const lines = [
    "# Close Business Smart List",
    "",
    `- Generated at: ${report.generated_at}`,
    `- Total business prospects: ${report.summary.total}`,
    `- Painting / Home Services: ${report.summary.painting}`,
    `- Venues / Event Companies: ${report.summary.venues}`,
    `- Other Companies: ${report.summary.other}`,
    "",
    "## Top Priority",
  ];
  for (const item of report.top_priority) {
    const status = [item.leadStatus, item.opportunityStatus].filter(Boolean).join(" | ");
    const emailLine = item.businessEmails.length ? item.businessEmails.join(", ") : "No business email saved";
    lines.push(`- ${item.leadName} [${item.category}, ${item.priorityScore}] | ${status} | ${item.nextStep} | ${emailLine}`);
  }
  for (const [label, items] of Object.entries(report.groups)) {
    lines.push("", `## ${label}`);
    if (!items.length) {
      lines.push("- None");
      continue;
    }
    for (const item of items.slice(0, 50)) {
      const status = [item.leadStatus, item.opportunityStatus].filter(Boolean).join(" | ");
      const website = item.website || "No website saved";
      const emailLine = item.businessEmails.length ? item.businessEmails.join(", ") : "No business email saved";
      lines.push(`- ${item.leadName} | ${status} | ${item.nextStep} | ${website} | ${emailLine}`);
    }
  }
  return `${lines.join("\n").trim()}\n`;
}

function pickContactForChannel(lead, channel) {
  const contacts = [...(lead.contacts || [])];
  contacts.sort((left, right) => (right.emails?.length || right.phones?.length || 0) - (left.emails?.length || left.phones?.length || 0));
  for (const contact of contacts) {
    if ((channel === "email" || channel === "auto") && (contact.emails || []).length > 0) {
      const email = contact.emails.find((item) => item.email && !item.is_unsubscribed) || contact.emails[0];
      if (email?.email) return { channel: "email", contact, email: email.email };
    }
    if ((channel === "sms" || channel === "auto") && (contact.phones || []).length > 0) {
      const phone = contact.phones.find((item) => item.phone) || contact.phones[0];
      if (phone?.phone) return { channel: "sms", contact, phone: phone.phone };
    }
  }
  return null;
}

function chooseEmailSender(accounts, preferredSender) {
  if (preferredSender) return preferredSender;
  const eligible = accounts.filter(
    (account) =>
      Array.isArray(account.enabled_features) &&
      account.enabled_features.includes("email_sending") &&
      account.send_status === "ok" &&
      account.default_identity?.email,
  );
  if (eligible.length === 0) return null;
  const account = eligible[0];
  const name = account.default_identity?.name || "Andre Raw";
  return `"${name}" <${account.default_identity.email}>`;
}

function chooseSmsLocalPhone(numbers, ownerId, preferredLocalPhone) {
  if (preferredLocalPhone) return preferredLocalPhone;
  const direct = numbers.find((item) => item.sms_enabled && item.user_id === ownerId && item.number);
  if (direct) return direct.number;
  const group = numbers.find((item) => item.sms_enabled && Array.isArray(item.participants) && item.participants.includes(ownerId) && item.number);
  return group?.number || null;
}

async function resolveLeadByName(client, leadName) {
  const candidates = await client.searchLeads(leadName, 25);
  const target = normalizeHumanName(leadName);
  const exact = candidates.find((lead) => [lead.display_name, lead.name].some((value) => normalizeHumanName(value) === target));
  if (exact) return client.getLead(exact.id);
  const partial = candidates.find((lead) => [lead.display_name, lead.name].some((value) => normalizeHumanName(value).includes(target)));
  if (partial) return client.getLead(partial.id);
  throw new Error(`Unable to find a Close lead matching "${leadName}".`);
}

function buildSingleLeadSnapshot(lead, activities) {
  return {
    generated_at: isoNow(),
    owner: null,
    leads: [lead],
    tasks: lead.tasks || [],
    activities,
    tasting_windows: [],
  };
}

async function generateMessageFromLeadContext(client, lead, ownerName, ownerId, channel, tastingWindows) {
  const activities = await client.getActivitiesForLead(lead.id);
  const snapshot = buildSingleLeadSnapshot(lead, activities);
  const signals = buildLeadSignals(snapshot, ownerName, ownerId, tastingWindows);
  const signal = signals[0];
  if (!signal) throw new Error(`Unable to build message context for lead "${lead.display_name || lead.name}".`);
  const recommendation = buildRecommendations([signal], "heartbeat")[0];
  const subject = channel === "sms" ? null : recommendation.draftSubject;
  return {
    signal,
    recommendation,
    subject,
    body: recommendation.draftBody,
  };
}

async function sendMessageForLead(client, args, ownerName, ownerId, outputDir) {
  if (!args.leadName && !args.leadId) {
    throw new Error("Messaging mode requires --lead-name or --lead-id.");
  }
  const lead = args.leadId ? await client.getLead(args.leadId) : await resolveLeadByName(client, args.leadName);
  const contactChoice = pickContactForChannel(lead, args.channel);
  if (!contactChoice) {
    throw new Error(`No usable ${args.channel === "auto" ? "email or SMS" : args.channel} contact was found for "${lead.display_name || lead.name}".`);
  }

  let generated = null;
  if (!args.body || (!args.subject && contactChoice.channel === "email")) {
    const tastingWindows = await loadTastingWindows();
    generated = await generateMessageFromLeadContext(client, lead, ownerName, ownerId, contactChoice.channel, tastingWindows);
  }
  const body = decodeCliText(args.body || generated?.body);
  const generatedSubject = ((generated?.subject) || `Message for ${lead.display_name || lead.name}`)
    .replace(/^Reply draft for /i, "Reply to ")
    .replace(/^Follow-up draft for /i, "Follow-up for ")
    .replace(/^Reactivation draft for /i, "Reactivation for ")
    .replace(/^Tasting invitation for /i, "Tasting invitation for ");
  const subject = decodeCliText(args.subject || generatedSubject);
  const auditLog = path.join(outputDir, "guardrail-audit.jsonl");
  const sentStatus = args.sendLive ? "sent" : "drafted";
  const language = generated?.signal?.language || detectLanguage(body, subject, lead.display_name, lead.name);
  if (args.sendLive && language === "pt") {
    throw new Error("Portuguese conversations are draft-only and cannot be live-sent.");
  }

  if (contactChoice.channel === "email") {
    const sender = chooseEmailSender(await client.getConnectedAccounts(), args.sender);
    if (args.sendLive && !sender) throw new Error("No eligible Close email sender is configured for live email sending.");
    const emailBody = appendEmailSignature(body);
    const payload = {
      lead_id: lead.id,
      contact_id: contactChoice.contact.id,
      status: args.sendLive ? "outbox" : "draft",
      to: [contactChoice.email],
      subject,
      body_text: emailBody,
    };
    if (sender) payload.sender = sender;
    const activity = await client.createEmailActivity(payload);
    const result = {
      mode: "message",
      sent_status: sentStatus,
      channel: "email",
      lead_id: lead.id,
      lead_name: lead.display_name || lead.name,
      contact_id: contactChoice.contact.id,
      recipient: contactChoice.email,
      subject,
      body: emailBody,
      activity_id: activity.id,
      status: activity.status,
    };
    await appendJsonl(auditLog, {
      timestamp: isoNow(),
      entity_type: "lead_message",
      entity_id: lead.id,
      channel: "email",
      action: sentStatus,
      activity_id: activity.id,
      recipient: contactChoice.email,
      subject,
    });
    return result;
  }

  const localPhone = chooseSmsLocalPhone(await client.getPhoneNumbers(), ownerId, args.localPhone);
  if (!localPhone) throw new Error("No SMS-enabled Close phone number is available for Andre.");
  const smsPayload = {
    lead_id: lead.id,
    contact_id: contactChoice.contact.id,
    status: args.sendLive ? "outbox" : "draft",
    local_phone: localPhone,
    remote_phone: contactChoice.phone,
    text: body,
  };
  const activity = await client.createSmsActivity(smsPayload);
  const result = {
    mode: "message",
    sent_status: sentStatus,
    channel: "sms",
    lead_id: lead.id,
    lead_name: lead.display_name || lead.name,
    contact_id: contactChoice.contact.id,
    recipient: contactChoice.phone,
    subject: null,
    body,
    activity_id: activity.id,
    status: activity.status,
  };
  await appendJsonl(auditLog, {
    timestamp: isoNow(),
    entity_type: "lead_message",
    entity_id: lead.id,
    channel: "sms",
    action: sentStatus,
    activity_id: activity.id,
    recipient: contactChoice.phone,
  });
  return result;
}

async function sendQuoteForLead(client, args, outputDir) {
  if (!args.leadName && !args.leadId) {
    throw new Error("Quote mode requires --lead-name or --lead-id.");
  }
  const lead = args.leadId ? await client.getLead(args.leadId) : await resolveLeadByName(client, args.leadName);
  const contactChoice = pickContactForChannel(lead, "email");
  if (!contactChoice?.email) {
    throw new Error(`No usable email contact was found for "${lead.display_name || lead.name}".`);
  }

  const quote = buildBallparkQuoteEmail(lead, args);
  const sender = chooseEmailSender(await client.getConnectedAccounts(), args.sender);
  const payload = {
    lead_id: lead.id,
    contact_id: contactChoice.contact.id,
    status: args.sendLive ? "outbox" : "draft",
    to: [contactChoice.email],
    subject: decodeCliText(quote.subject),
    body_text: decodeCliText(quote.body),
    body_html: decodeCliText(quote.bodyHtml),
  };
  if (sender) payload.sender = sender;
  const activity = await client.createEmailActivity(payload);
  const auditLog = path.join(outputDir, "guardrail-audit.jsonl");
  await appendJsonl(auditLog, {
    timestamp: isoNow(),
    entity_type: "lead_quote",
    entity_id: lead.id,
    action: args.sendLive ? "sent" : "drafted",
    activity_id: activity.id,
    recipient: contactChoice.email,
    subject: payload.subject,
    guest_counts: quote.guestCounts,
    tiers: quote.tiers.map((item) => ({ name: item.name, price_per_person: item.pricePerPerson })),
  });
  return {
    mode: "quote",
    sent_status: args.sendLive ? "sent" : "drafted",
    channel: "email",
    lead_id: lead.id,
    lead_name: lead.display_name || lead.name,
    contact_id: contactChoice.contact.id,
    recipient: contactChoice.email,
    subject: payload.subject,
    body: payload.body_text,
    activity_id: activity.id,
    status: activity.status,
  };
}

async function dedupeInboxTasks(client, args, outputDir) {
  const ownerName = args.ownerName || "Andre";
  const owner =
    args.ownerId
      ? { id: args.ownerId, full_name: ownerName }
      : await client.findOwner(ownerName);
  const tasks = await client.listResource("task/", {
    assigned_to: owner.id,
    is_complete: "false",
    view: "inbox",
    _type: "all",
    _order_by: "date",
  });
  const grouped = new Map();
  for (const task of tasks) {
    if (!task.lead_id) continue;
    if (!grouped.has(task.lead_id)) grouped.set(task.lead_id, []);
    grouped.get(task.lead_id).push(task);
  }

  const auditLog = path.join(outputDir, "guardrail-audit.jsonl");
  const updates = [];
  for (const [leadId, leadTasks] of grouped.entries()) {
    if (leadTasks.length <= 1) continue;
    const sorted = [...leadTasks].sort((left, right) =>
      String(left.date || left.due_date || "").localeCompare(String(right.date || right.due_date || "")) ||
      String(left.date_created || "").localeCompare(String(right.date_created || "")),
    );
    const [keptTask, ...duplicateTasks] = sorted;
    let leadName = leadId;
    try {
      const lead = await client.getLead(leadId);
      leadName = lead.display_name || lead.name || leadId;
    } catch {}
    for (const duplicateTask of duplicateTasks) {
      const updated = await client.completeTask(duplicateTask.id);
      const record = {
        timestamp: isoNow(),
        entity_type: "task",
        entity_id: duplicateTask.id,
        action: "deduped_complete",
        lead_id: leadId,
        lead_name: leadName,
        kept_task_id: keptTask.id,
        kept_task_date: keptTask.date || keptTask.due_date || null,
        removed_task_date: duplicateTask.date || duplicateTask.due_date || null,
        removed_task_type: duplicateTask._type || "lead",
        response_id: updated.id || null,
      };
      updates.push(record);
      await appendJsonl(auditLog, record);
    }
  }

  return {
    mode: "dedupe-inbox",
    owner_id: owner.id,
    owner_name: owner.full_name || ownerName,
    open_tasks_scanned: tasks.length,
    duplicate_tasks_completed: updates.length,
    affected_leads: [...new Set(updates.map((item) => item.lead_id))].length,
    updates,
  };
}

function bucketSections(recommendations) {
  const groups = {
    "Replies owed now": [],
    "Follow-ups due today": [],
    "Hot leads at risk": [],
    "Warm nurture candidates": [],
    "Cold reactivation candidates": [],
    "Tasting invite opportunities": [],
    "Tasks rolled to next business day": [],
  };
  for (const item of recommendations) {
    if (item.communicationStatus === "lead_waiting_on_andre") groups["Replies owed now"].push(item);
    if (["follow up", "reply"].includes(item.recommendedAction)) groups["Follow-ups due today"].push(item);
    if (item.statusBucket === "Hot") groups["Hot leads at risk"].push(item);
    if (item.statusBucket === "Warm") groups["Warm nurture candidates"].push(item);
    if (item.statusBucket === "Cold") groups["Cold reactivation candidates"].push(item);
    if (item.tastingInvite) groups["Tasting invite opportunities"].push(item);
    if (item.recommendedAction === "roll") groups["Tasks rolled to next business day"].push(item);
  }
  return groups;
}

function buildReport(recommendations, checkpoint, ownerName, ownerId) {
  return {
    generated_at: isoNow(),
    checkpoint,
    owner: { name: ownerName, id: ownerId },
    summary: {
      total_leads: recommendations.length,
      hot: recommendations.filter((item) => item.statusBucket === "Hot").length,
      warm: recommendations.filter((item) => item.statusBucket === "Warm").length,
      cold: recommendations.filter((item) => item.statusBucket === "Cold").length,
      drafted: recommendations.filter((item) => item.auditStatus === "drafted").length,
      rolled: recommendations.filter((item) => item.auditStatus === "rolled").length,
      skipped: recommendations.filter((item) => item.auditStatus === "skipped").length,
    },
    sections: bucketSections(recommendations),
    drafts: recommendations.filter((item) => item.recommendedAction !== "wait"),
    all_leads: recommendations,
  };
}

function renderMarkdown(report) {
  const lines = [
    `# Close Revenue Guardrail — ${report.checkpoint[0].toUpperCase()}${report.checkpoint.slice(1)} Sweep`,
    "",
    `- Generated at: ${report.generated_at}`,
    `- Owner: ${report.owner.name}`,
    `- Total leads classified: ${report.summary.total_leads}`,
    `- Hot/Warm/Cold: ${report.summary.hot} / ${report.summary.warm} / ${report.summary.cold}`,
    "",
  ];
  for (const [section, entries] of Object.entries(report.sections)) {
    lines.push(`## ${section}`);
    if (!entries.length) {
      lines.push("- None", "");
      continue;
    }
    for (const entry of entries) {
      const rationale = entry.rationale.slice(0, 2).join("; ");
      const statusLine = [entry.leadStatus, entry.opportunityStatus].filter(Boolean).join(" | ");
      lines.push(`- ${entry.leadName} [${entry.statusBucket}, ${entry.score}] -> ${entry.recommendedAction} (${entry.artifactMode}) | ${statusLine} | ${rationale}`);
    }
    lines.push("");
  }
  lines.push("## Drafts");
  for (const draft of report.drafts.slice(0, 10)) {
    lines.push(`### ${draft.leadName}`);
    lines.push(`- Action: ${draft.recommendedAction}`);
    lines.push(`- Subject: ${draft.draftSubject}`);
    lines.push(`- Mode: ${draft.artifactMode}`);
    if (draft.leadStatus || draft.opportunityStatus) lines.push(`- Status: ${[draft.leadStatus, draft.opportunityStatus].filter(Boolean).join(" | ")}`);
    if (draft.cadenceStep) lines.push(`- Cadence: ${draft.cadenceStep}`);
    if (draft.recentInboundMessages?.length) {
      lines.push("- Last 3 inbound messages:");
      for (const message of draft.recentInboundMessages.slice(0, 3)) {
        const preview = (message.subject || message.body || "").replace(/\s+/g, " ").slice(0, 120);
        lines.push(`  - ${message.timestamp} | answered=${message.answered ? "yes" : "no"} | ${preview}`);
      }
    }
    lines.push("", draft.draftBody, "");
  }
  return `${lines.join("\n").trim()}\n`;
}

async function loadSnapshotFromFixture(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function loadTastingWindows() {
  if (process.env.CLOSE_TASTING_WINDOWS) {
    try {
      const parsed = JSON.parse(process.env.CLOSE_TASTING_WINDOWS);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
  }
  if (process.env.CLOSE_TASTING_WINDOWS_FILE) {
    try {
      const parsed = JSON.parse(await fs.readFile(process.env.CLOSE_TASTING_WINDOWS_FILE, "utf8"));
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
  }
  return [];
}

async function loadLiveSnapshot(client, ownerName, ownerId) {
  const tasks = await client.getTasks(ownerId);
  const maxLeads = Number(process.env.CLOSE_GUARDRAIL_MAX_LEADS || "0");
  const leadIds = [...new Set(tasks.map((task) => task.lead_id).filter(Boolean))].sort();
  let leads = [];
  for (const leadId of leadIds) {
    try {
      const lead = await client.getLead(leadId);
      if (lead?.id) leads.push(lead);
    } catch {}
    if (maxLeads > 0 && leads.length >= maxLeads) break;
  }
  if (!leads.length) {
    const queryOverride = process.env.CLOSE_LEAD_QUERY || null;
    leads = await client.getLeads(ownerName, ownerId, queryOverride);
  }
  const activities = [];
  for (const lead of leads) {
    try {
      activities.push(...(await client.getActivitiesForLead(lead.id)));
    } catch {}
  }
  return {
    generated_at: isoNow(),
    owner: { name: ownerName, id: ownerId },
    leads,
    tasks,
    activities,
    tasting_windows: await loadTastingWindows(),
  };
}

async function maybeRollTasks(client, snapshot, recommendations, allowMutations, auditLogPath) {
  if (!allowMutations || !client) return [];
  const updates = [];
  const dueDate = nextBusinessDayIso(todayEtIso());
  const targetLeadIds = new Set(recommendations.filter((item) => item.recommendedAction === "roll").map((item) => item.leadId));
  for (const task of snapshot.tasks || []) {
    const taskDate = String(task.due_date || task.date || "").slice(0, 10);
    if (!targetLeadIds.has(task.lead_id) || task.is_complete || !taskDate || taskDate >= todayEtIso()) continue;
    const updated = await client.updateTaskDueDate(task.id, dueDate);
    const record = {
      timestamp: isoNow(),
      entity_type: "task",
      entity_id: task.id,
      action: "rolled",
      new_due_date: dueDate,
      response_id: updated.id || null,
    };
    updates.push(record);
    await appendJsonl(auditLogPath, record);
  }
  return updates;
}

export {
  buildBallparkQuoteEmail,
  buildLeadSignals,
  buildRecommendations,
  buildReport,
  buildSmartList,
  checkpointDueNow,
  CloseClient,
  dedupeInboxTasks,
  loadLiveSnapshot,
  loadSnapshotFromFixture,
  nextBusinessDayIso,
  renderSmartListMarkdown,
  sendQuoteForLead,
  sendMessageForLead,
  renderMarkdown,
  selectCheckpoint,
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await ensureDir(args.outputDir);
  let ownerName = args.ownerName;
  let ownerId = args.ownerId;
  let client = null;

  if (!args.snapshot) {
    if (!process.env.CLOSE_API_KEY) {
      console.error("CLOSE_API_KEY is required for live mode.");
      process.exit(2);
    }
    client = new CloseClient(process.env.CLOSE_API_KEY, args.apiBaseUrl);
    const owner = await client.findOwner(ownerName);
    ownerId = ownerId || owner.id;
    ownerName = owner.full_name || `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || ownerName;
  }

  if (args.mode === "message") {
    if (!client) {
      console.error("Messaging mode requires live Close access and cannot run against a fixture snapshot.");
      process.exit(2);
    }
    const result = await sendMessageForLead(client, args, ownerName, ownerId, args.outputDir);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  if (args.mode === "quote") {
    if (!client) {
      console.error("Quote mode requires live Close access and cannot run against a fixture snapshot.");
      process.exit(2);
    }
    const result = await sendQuoteForLead(client, args, args.outputDir);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  if (args.mode === "dedupe-inbox") {
    if (!client) {
      console.error("Dedupe mode requires live Close access and cannot run against a fixture snapshot.");
      process.exit(2);
    }
    const result = await dedupeInboxTasks(client, args, args.outputDir);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  if (args.mode === "smart-list") {
    const leads = await client.listResource("lead/", { _order_by: "date_updated" });
    const report = buildSmartList(leads, ownerName);
    const stem = `${todayEtIso()}-business-smart-list`;
    const jsonPath = path.join(args.outputDir, `${stem}.json`);
    const mdPath = path.join(args.outputDir, `${stem}.md`);
    await writeJson(jsonPath, report);
    await fs.writeFile(mdPath, renderSmartListMarkdown(report), "utf8");
    process.stdout.write(`${JSON.stringify({ mode: "smart-list", json: jsonPath, markdown: mdPath, summary: report.summary })}\n`);
    return;
  }

  const checkpoint = selectCheckpoint(args.checkpoint);
  if (!args.forceRun && !checkpointDueNow(checkpoint)) {
    console.error(`Skipping ${checkpoint} sweep because current ET time is outside the checkpoint window.`);
    process.exit(0);
  }

  const auditLog = path.join(args.outputDir, "guardrail-audit.jsonl");
  let snapshot;
  if (args.snapshot) {
    snapshot = await loadSnapshotFromFixture(args.snapshot);
    ownerName = snapshot.owner?.name || ownerName;
    ownerId = snapshot.owner?.id || ownerId;
  } else {
    snapshot = await loadLiveSnapshot(client, ownerName, ownerId);
  }

  const tastingWindows = snapshot.tasting_windows || (await loadTastingWindows());
  const signals = buildLeadSignals(snapshot, ownerName, ownerId, tastingWindows);
  const recommendations = buildRecommendations(signals, checkpoint);
  const report = buildReport(recommendations, checkpoint, ownerName, ownerId);
  const allowMutations = args.allowRollover && process.env.CLOSE_GUARDRAIL_ALLOW_TASK_MUTATIONS === "1";
  report.task_updates = await maybeRollTasks(client, snapshot, recommendations, allowMutations, auditLog);

  const stem = `${todayEtIso()}-${checkpoint}`;
  const jsonPath = path.join(args.outputDir, `${stem}.json`);
  const mdPath = path.join(args.outputDir, `${stem}.md`);
  await writeJson(jsonPath, report);
  await fs.writeFile(mdPath, renderMarkdown(report), "utf8");

  for (const item of recommendations) {
    await appendJsonl(auditLog, {
      timestamp: isoNow(),
      entity_type: "lead",
      entity_id: item.leadId,
      checkpoint,
      status_bucket: item.statusBucket,
      recommended_action: item.recommendedAction,
      audit_status: item.auditStatus,
      language: item.language,
      artifact_mode: item.artifactMode,
    });
  }

  process.stdout.write(`${JSON.stringify({ checkpoint, json: jsonPath, markdown: mdPath })}\n`);
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
