import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const sourceArgIndex = process.argv.indexOf("--source-dir");
const sourceArgValue = sourceArgIndex >= 0 ? process.argv[sourceArgIndex + 1] : null;
const sourceDirOverride = sourceArgValue || process.env.MISSION_CONTROL_SOURCE_DIR || path.join("close_guardrail", "output");
const outputDir = path.resolve(root, sourceDirOverride);
const targetFile = path.join(root, "mission-control-data", "latest.json");
const slackWatchFile = path.join(root, ".cache", "slack-watch", "latest.json");
const cadenceSenderStateFile = path.join(root, ".cache", "agent-control", "cadence-sender", "latest.json");
const inboxReaderStateFile = path.join(root, ".cache", "agent-control", "inbox-reader", "latest.json");
const tastingCloserStateFile = path.join(root, ".cache", "agent-control", "tasting-closer", "latest.json");

function toCloseUrl(leadId) {
  return `https://app.close.com/lead/${leadId}/`;
}

function sanitizeLink(rawLink) {
  if (!rawLink) return null;
  const trimmed = String(rawLink).trim();
  if (!trimmed) return null;
  const withoutSlackLabel = trimmed.split("|")[0].trim();
  if (!/^https?:\/\//i.test(withoutSlackLabel)) return null;
  return withoutSlackLabel;
}

function parseSnapshotName(name) {
  const match = name.match(/^(\d{4}-\d{2}-\d{2})-(morning|heartbeat|eod)\.json$/);
  if (!match) return null;
  const rank = { morning: 1, heartbeat: 2, eod: 3 }[match[2]] || 0;
  return { name, day: match[1], checkpoint: match[2], rank };
}

async function listSnapshots() {
  const files = await fs.readdir(outputDir);
  return files.map(parseSnapshotName).filter(Boolean).sort((left, right) =>
    left.day.localeCompare(right.day) || left.rank - right.rank,
  );
}

async function loadSnapshotByName(name) {
  const fullPath = path.join(outputDir, name);
  const payload = JSON.parse(await fs.readFile(fullPath, "utf8"));
  return { name, fullPath, payload };
}

async function loadOptionalJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function mapLead(entry, section) {
  return {
    type: "crm",
    section,
    leadId: entry.leadId,
    leadName: entry.leadName,
    statusBucket: entry.statusBucket,
    score: entry.score,
    recommendedAction: entry.recommendedAction,
    recommendedLane: entry.recommendedLane,
    holdBucket: entry.holdBucket || null,
    stage: entry.opportunityStatus || entry.stage || "",
    nextStepDue: entry.nextStepDue || null,
    rationale: entry.rationale || [],
    whyNow: entry.whyNow || entry.rationale?.[0] || null,
    reviewNextStep: entry.reviewNextStep || null,
    cadenceStep: entry.cadenceStep || null,
    cadenceNextTouch: entry.cadenceNextTouch || null,
    cadenceStopReason: entry.cadenceStopReason || null,
    cadenceActive: Boolean(entry.cadenceActive),
    assignmentFreshness: entry.assignmentFreshness || "older",
    bestCallSlot: entry.bestCallSlot || null,
    secondBestCallSlot: entry.secondBestCallSlot || null,
    link: sanitizeLink(entry.link) || toCloseUrl(entry.leadId),
  };
}

function mapSlackItem(entry, section) {
  return {
    type: "slack",
    section,
    leadId: null,
    leadName: entry.item,
    statusBucket: entry.priority || "Watch",
    score: entry.type === "reply_now" ? 130 : entry.type === "assigned_to_andre" ? 120 : 90,
    recommendedAction: entry.type === "reply_now" ? "review inbound" : entry.type === "assigned_to_andre" ? "start cadence" : "review mention",
    recommendedLane: entry.type,
    holdBucket: null,
    stage: `Slack · #${entry.channelLabel}`,
    nextStepDue: null,
    rationale: [entry.reason],
    whyNow: entry.reason,
    reviewNextStep: entry.nextMove,
    cadenceStep: entry.type === "assigned_to_andre" ? "Start 7-touch cadence" : null,
    cadenceActive: false,
    assignmentFreshness: null,
    bestCallSlot: null,
    secondBestCallSlot: null,
    link: sanitizeLink(entry.link),
    channelLabel: entry.channelLabel,
    slackType: entry.type,
    preview: entry.preview || "",
  };
}

function leadMap(entries = []) {
  return new Map(entries.map((entry) => [entry.leadId, entry]));
}

function buildComparison(currentSnapshot, morningSnapshot) {
  if (!morningSnapshot || currentSnapshot.checkpoint !== "eod") return null;
  const morning = leadMap(morningSnapshot.all_leads || []);
  const evening = leadMap(currentSnapshot.all_leads || []);
  const repliedSinceMorning = [];
  const movedToCallLane = [];
  const movedToTastingLane = [];
  const nextMorningPriorities = [];
  for (const [leadId, current] of evening.entries()) {
    const previous = morning.get(leadId);
    if (!previous) continue;
    if (previous.communicationStatus === "lead_waiting_on_andre" && current.communicationStatus !== "lead_waiting_on_andre") {
      repliedSinceMorning.push({ leadId, leadName: current.leadName });
    }
    if (previous.recommendedLane !== "push_to_call" && current.recommendedLane === "push_to_call") {
      movedToCallLane.push({ leadId, leadName: current.leadName });
    }
    if (previous.recommendedLane !== "push_to_tasting" && current.recommendedLane === "push_to_tasting") {
      movedToTastingLane.push({ leadId, leadName: current.leadName });
    }
    if (current.recommendedLane === "push_to_call" || current.communicationStatus === "lead_waiting_on_andre") {
      nextMorningPriorities.push({ leadId, leadName: current.leadName, lane: current.recommendedLane });
    }
  }
  const callSlotsFilled = (currentSnapshot.sections["Today Call Slots"] || []).filter((slot) => slot.status !== "open").length;
  const untouchedLeadsRolled = (currentSnapshot.sections["End-of-Day Rollovers"] || []).length;
  return {
    baseline: morningSnapshot.generated_at,
    repliedSinceMorning,
    movedToCallLane,
    movedToTastingLane,
    callSlotsFilled,
    untouchedLeadsRolled,
    nextMorningPriorities: nextMorningPriorities.slice(0, 8),
  };
}

function toSquadItem(entry, owner, status, nextMove, extra = {}) {
  return {
    item: entry.leadName,
    reason: entry.whyNow || entry.rationale?.[0] || "Needs operator review.",
    nextMove: nextMove || entry.reviewNextStep || "Review lead context before acting.",
    owner,
    status,
    leadId: entry.leadId,
    link: sanitizeLink(entry.link) || toCloseUrl(entry.leadId),
    lane: entry.recommendedLane,
    stage: entry.stage || "",
    bestCallSlot: entry.bestCallSlot || null,
    assignmentFreshness: entry.assignmentFreshness || null,
    ...extra,
  };
}

function dedupeByItem(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (!entry?.item || seen.has(entry.item)) return false;
    seen.add(entry.item);
    return true;
  });
}

function dedupeByLead(entries = []) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = entry?.leadId || entry?.leadName;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeFocusItems(entries = []) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = [
      entry?.leadId,
      entry?.leadName,
      entry?.recommendedLane,
      entry?.section,
    ]
      .filter(Boolean)
      .join("::");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isAndreVisible(entry) {
  return entry && entry.holdBucket !== "not_yours";
}

function recentCadenceEntries(entries = []) {
  return entries.filter((entry) =>
    isAndreVisible(entry) &&
    ["this_week", "today", "two_weeks"].includes(String(entry.assignmentFreshness || "").toLowerCase()),
  );
}

function deriveCadenceState(entry) {
  if (!entry) return "review";
  if (entry.holdBucket === "archive_review" || entry.holdBucket === "weak_context_review") return "review";
  if (entry.holdBucket === "held_recent_touch") return "waiting";
  if (entry.holdBucket === "booked_or_closed") return "waiting";
  if (entry.recommendedLane === "do_not_touch") return "review";
  return "ready";
}

function cadenceStateLabel(state) {
  return {
    ready: "Ready to touch",
    waiting: "Waiting / paused",
    review: "Review first",
  }[state] || "Review first";
}

function cadenceTouchNumber(entry) {
  const raw = String(entry?.cadenceStep || "");
  const match = raw.match(/\b(?:day|tp|touch)\s*(\d{1,2})\b/i) || raw.match(/\b(\d{1,2})\b/);
  return match ? Number(match[1]) : null;
}

function cadenceWorkflowStage(entry) {
  const touch = cadenceTouchNumber(entry);
  const stopReason = String(entry?.cadenceStopReason || "").toLowerCase();
  const stage = String(entry?.stage || "").toLowerCase();

  if (stopReason === "call booked" || /booked call|consultation booked|phone call booked/.test(stage)) {
    return "call_booked";
  }
  if (stopReason === "tasting booked") {
    return "pre_tasting_call_required";
  }
  if (stopReason === "replied") {
    return "waiting_on_reply";
  }
  if (stopReason) {
    return "stopped";
  }
  if (touch === 1) {
    return "touch_1_call_probe";
  }
  if (touch === 2) {
    return "touch_2_call_plus_tasting";
  }
  if (touch && touch >= 3) {
    return "touch_n_follow_up";
  }
  return entry?.cadenceActive ? "touch_1_call_probe" : "stopped";
}

function cadenceWorkflowLabel(stage) {
  return {
    touch_1_call_probe: "Touch 1 · phone call probe",
    touch_2_call_plus_tasting: "Touch 2 · phone + tasting",
    touch_n_follow_up: "Touch 3+ · keep pressure",
    waiting_on_reply: "Waiting on reply",
    call_booked: "Call booked",
    pre_tasting_call_required: "Pre-tasting call required",
    stopped: "Stopped",
  }[stage] || "Review";
}

function cadenceWorkflowNextMove(stage, tastingTarget) {
  return {
    touch_1_call_probe: "Send the first NEPQ email and drive toward a real call slot.",
    touch_2_call_plus_tasting: `Send the second NEPQ touch, add the tasting CTA, and push toward ${tastingTarget || "the next tasting"}.`,
    touch_n_follow_up: "Stay on the seven-day cadence without sending duplicate noise.",
    waiting_on_reply: "Do not send again. Watch for the reply and hand it to Inbox Reader.",
    call_booked: "Get the call into Andre's calendar and protect the slot.",
    pre_tasting_call_required: "Book the mandatory pre-tasting call so expectations are set before the tasting.",
    stopped: "Leave it alone unless Andre explicitly overrides.",
  }[stage] || "Review the last two communications before acting.";
}

function buildCadenceControl(entries = [], tastingTarget) {
  const mapped = dedupeByLead(entries).map((entry) => {
    const workflowStage = cadenceWorkflowStage(entry);
    return {
      ...entry,
      cadenceTouchNumber: cadenceTouchNumber(entry),
      workflowStage,
      workflowLabel: cadenceWorkflowLabel(workflowStage),
      workflowNextMove: cadenceWorkflowNextMove(workflowStage, tastingTarget),
    };
  });

  const buckets = {
    touch1: mapped.filter((entry) => entry.workflowStage === "touch_1_call_probe"),
    touch2: mapped.filter((entry) => entry.workflowStage === "touch_2_call_plus_tasting"),
    followUp: mapped.filter((entry) => entry.workflowStage === "touch_n_follow_up"),
    waiting: mapped.filter((entry) => entry.workflowStage === "waiting_on_reply"),
    callBooked: mapped.filter((entry) => entry.workflowStage === "call_booked"),
    preTastingCall: mapped.filter((entry) => entry.workflowStage === "pre_tasting_call_required"),
    stopped: mapped.filter((entry) => entry.workflowStage === "stopped"),
  };

  return {
    all: mapped,
    summary: {
      total: mapped.length,
      touch1: buckets.touch1.length,
      touch2: buckets.touch2.length,
      followUp: buckets.followUp.length,
      waiting: buckets.waiting.length,
      callBooked: buckets.callBooked.length,
      preTastingCall: buckets.preTastingCall.length,
      stopped: buckets.stopped.length,
      readyForAutomation: buckets.touch1.length + buckets.touch2.length + buckets.followUp.length,
    },
    readyForAutomation: [...buckets.touch1, ...buckets.touch2, ...buckets.followUp],
    ...buckets,
  };
}

function leadLooksTastingReady(entry) {
  const combined = [
    entry?.recommendedLane,
    entry?.recommendedAction,
    entry?.stage,
    entry?.whyNow,
    ...(entry?.rationale || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return combined.includes("tasting");
}

function buildAgent({
  title,
  color,
  environment,
  owns,
  focus,
  trigger,
  reads,
  writes,
  handoff,
  autonomy,
  items,
  runtime = null,
}) {
  return {
    title,
    color,
    environment,
    owns,
    focus,
    trigger,
    reads,
    writes,
    handoff,
    autonomy,
    runtime,
    queueSize: items.length,
    items,
  };
}

function buildSquadAssignments({
  slackReplyNow,
  replies,
  callPushes,
  tastingPushes,
  cadenceQueue,
  cadenceControl,
  cadenceBuckets,
  archiveReview,
  holdRecentTouch,
  weakContextReview,
  doNotTouch,
  callSlots,
  tastingTarget,
  cadenceSenderState = null,
  inboxReaderState = null,
  tastingCloserState = null,
}) {
  const inboxItems = dedupeByItem([
    ...slackReplyNow.slice(0, 3).map((entry) => ({
      item: entry.leadName,
      reason: entry.whyNow || "Inbound activity needs Andre now.",
      nextMove: entry.reviewNextStep || "Read the latest inbound and prep the next reply.",
      owner: "Inbox Reader",
      status: "reply_now",
      leadId: entry.leadId,
      link: entry.link || null,
      lane: entry.recommendedLane,
      stage: entry.stage,
      bestCallSlot: null,
      assignmentFreshness: null,
    })),
    ...replies.slice(0, 5).map((entry) =>
      toSquadItem(entry, "Inbox Reader", "reply_now", "Read the last two communications and prep the next answer."),
    ),
  ]).slice(0, 8);

  const cadenceItems = dedupeByItem([
    ...cadenceControl.touch1.slice(0, 4).map((entry) =>
      toSquadItem(
        entry,
        "Cadence Sender",
        "touch_1",
        `Send the first NEPQ touch and probe directly toward ${entry.bestCallSlot || "a phone call"}.`,
      ),
    ),
    ...cadenceControl.touch2.slice(0, 4).map((entry) =>
      toSquadItem(
        entry,
        "Cadence Sender",
        "touch_2",
        `Send the second touch, push toward ${entry.bestCallSlot || "a call"}, and offer ${tastingTarget || "the tasting"}.`,
      ),
    ),
    ...cadenceBuckets.waiting.slice(0, 2).map((entry) =>
      toSquadItem(
        entry,
        "Cadence Sender",
        "paused_watch",
        "Keep this lead visible, but do not force another touch until the hold clears.",
      ),
    ),
  ]).slice(0, 8);

  const callItems = dedupeByItem([
    ...callPushes.slice(0, 4).map((entry) =>
      toSquadItem(
        entry,
        "Call Booker",
        "call_push",
        `Read the comms and try to lock ${entry.bestCallSlot || "the next best call slot"} without forcing.`,
      ),
    ),
  ]);

  const slotCoverage = callSlots
    .filter((slot) => slot.status === "open")
    .slice(0, 3)
    .map((slot) => ({
      item: `${slot.slot} call slot`,
      reason: slot.fallbackCandidates?.length
        ? `${slot.fallbackCandidates[0].leadName} is the strongest current fallback candidate.`
        : "No strong candidate has been assigned yet.",
      nextMove: slot.fallbackCandidates?.length
        ? `Work ${slot.fallbackCandidates[0].leadName} toward this slot.`
        : "Leave open until a real call-worthy lead appears.",
      owner: "Call Booker",
      status: slot.fallbackCandidates?.length ? "slot_open" : "slot_idle",
      leadId: slot.fallbackCandidates?.[0]?.leadId || null,
      link: slot.fallbackCandidates?.[0]?.leadId ? toCloseUrl(slot.fallbackCandidates[0].leadId) : null,
      lane: "call_slot",
      stage: slot.status,
      bestCallSlot: slot.slot,
      assignmentFreshness: null,
    }));

  const tastingItems = dedupeByItem([
    ...tastingPushes.slice(0, 5).map((entry) =>
      toSquadItem(
        entry,
        "Tasting Closer",
        "tasting_push",
        `Use current context and move this lead toward ${tastingTarget || "the next tasting window"}.`,
        { laneIntent: "tasting" },
      ),
    ),
    ...cadenceBuckets.ready
      .filter((entry) => leadLooksTastingReady(entry))
      .slice(0, 3)
      .map((entry) =>
        toSquadItem(
          entry,
          "Tasting Closer",
          "tasting_ready",
          `If a call is not cleaner, move this lead toward ${tastingTarget || "the tasting"} next.`,
          { laneIntent: "tasting" },
        ),
      ),
  ]).slice(0, 8);

  const dormantItems = dedupeByItem([
    ...archiveReview.map((entry) =>
      toSquadItem(entry, "Dormant Reviewer", "dormant_review", "Read the history and decide whether this should stay in cadence or be archived."),
    ),
  ]).slice(0, 8);

  const holdItems = dedupeByItem([
    ...holdRecentTouch.map((entry) =>
      toSquadItem(
        entry,
        "Hold Watcher",
        "touch_hold",
        "Wait out the touch hold, then bring this lead back into cadence at the right time.",
      ),
    ),
    ...weakContextReview.map((entry) =>
      toSquadItem(
        entry,
        "Hold Watcher",
        "context_hold",
        "Get the missing context before this lead gets another touch.",
      ),
    ),
  ]).slice(0, 8);

  return {
    inboxReader: buildAgent({
      title: "Inbox Reader",
      color: "cyan",
      environment: "Local workstation",
      owns: "Inbound comms + replies owed now",
      focus: "Reads the freshest inbound so Andre never misses a live buying signal.",
      trigger: "Client reply, inbound Slack signal, or reply-now lead",
      reads: "#inbound_comms-andre, replies owed queue, last two lead comms",
      writes: "Next reply draft, call suggestion, urgency handoff",
      handoff: "Passes qualified live replies to Call Booker or Cadence Sender",
      autonomy: "assisted now · autonomous next",
      runtime: inboxReaderState,
      items: inboxItems,
    }),
    cadenceSender: buildAgent({
      title: "Cadence Sender",
      color: "amber",
      environment: "VM sandbox",
      owns: "7-touch active cadence",
      focus: "Keeps every recent Andre assignment moving so no fresh lead dies in silence.",
      trigger: "Andre-owned lead assigned within the last 14 days",
      reads: "Cadence history, last two touches, next due task",
      writes: "Next NEPQ email/SMS draft and cadence rollover",
      handoff: "Hands off hot responders to Inbox Reader or Call Booker",
      autonomy: "ready for controlled automation",
      runtime: cadenceSenderState,
      items: cadenceItems,
    }),
    callBooker: buildAgent({
      title: "Call Booker",
      color: "magenta",
      environment: "Local workstation",
      owns: "Call push lane + daily slots",
      focus: "Turns the right people into real conversations at 10, 11, 1, 3, or 7.",
      trigger: "Lead shows urgency, asks for a call, or fits an open slot",
      reads: "Call push queue, slot board, recent comms, stated availability",
      writes: "Call confirmation, slot recommendation, agenda reminder",
      handoff: "Hands off post-call follow-up to Cadence Sender or Tasting Closer",
      autonomy: "assisted now",
      items: dedupeByItem([...callItems, ...slotCoverage]).slice(0, 8),
    }),
    tastingCloser: buildAgent({
      title: "Tasting Closer",
      color: "green",
      environment: "VM sandbox",
      owns: "April tasting conversion",
      focus: "Pushes tasting-ready leads into the next tasting without forcing cold leads.",
      trigger: "Lead is tasting-adjacent or a call is weaker than tasting",
      reads: "Tasting push lane, tasting-ready cadence items, tasting calendar",
      writes: "Invite draft, tasting CTA, registration follow-up",
      handoff: "Hands off registered tasters to Call Booker or Hold Watcher",
      autonomy: "ready for controlled automation",
      runtime: tastingCloserState,
      items: tastingItems,
    }),
    dormantReviewer: buildAgent({
      title: "Dormant Reviewer",
      color: "purple",
      environment: "Local workstation",
      owns: "Dormant review queue",
      focus: "Decides which stale leads deserve one more shot and which should leave the pipe.",
      trigger: "Dormant review or archive decision needed",
      reads: "Full history, objections, last response date, stage drift",
      writes: "Revive draft, archive decision, or dormant hold note",
      handoff: "Sends revived leads back into Cadence Sender",
      autonomy: "manual by design",
      items: dormantItems,
    }),
    holdWatcher: buildAgent({
      title: "Hold Watcher",
      color: "red",
      environment: "Local workstation",
      owns: "Paused, booked, or blocked Andre leads",
      focus: "Keeps held leads visible without letting the team touch the wrong thing at the wrong time.",
      trigger: "Touch hold, booked/closed monitor, or context hold",
      reads: "Hold reasons, booked state, weak-context flags",
      writes: "Return-to-work flag when hold clears",
      handoff: "Returns leads to Cadence Sender, Tasting Closer, or Call Booker",
      autonomy: "semi-automatic guardrail",
      items: dedupeByItem([
        ...holdItems,
        ...doNotTouch.map((entry) =>
          toSquadItem(
            entry,
            "Hold Watcher",
            "do_not_work",
            "Keep this visible, but do not work it until the reason to hold changes.",
          ),
        ),
      ]).slice(0, 8),
    }),
  };
}

async function main() {
  const snapshots = await listSnapshots();
  if (!snapshots.length) {
    throw new Error("No guardrail snapshot JSON files were found in close_guardrail/output.");
  }

  const latestMeta = snapshots[snapshots.length - 1];
  const latestLoaded = await loadSnapshotByName(latestMeta.name);
  const latestSnapshot = latestLoaded.payload;
  const sameDayMorningMeta = snapshots.find((item) => item.day === latestMeta.day && item.checkpoint === "morning");
  const morningLoaded = sameDayMorningMeta ? await loadSnapshotByName(sameDayMorningMeta.name) : null;
  const replies = (latestSnapshot.sections["Replies owed now"] || []).map((entry) => mapLead(entry, "Replies owed now")).filter(isAndreVisible);
  const callPushes = (latestSnapshot.sections["Call Push Queue"] || []).map((entry) => mapLead(entry, "Call Push Queue")).filter(isAndreVisible);
  const tastingPushes = (latestSnapshot.sections["Tasting Push Queue"] || []).map((entry) => mapLead(entry, "Tasting Push Queue")).filter(isAndreVisible);
  const nurtureQueue = (latestSnapshot.sections["Nurture Queue"] || []).map((entry) => mapLead(entry, "Nurture Queue")).filter(isAndreVisible);
  const rawDoNotTouch = (latestSnapshot.sections["Do Not Touch"] || []).map((entry) => mapLead(entry, "Do Not Work Now"));
  const doNotTouch = rawDoNotTouch.filter((entry) => isAndreVisible(entry) && entry.holdBucket !== "archive_review");
  const holdRecentTouch = (latestSnapshot.sections["Held - Touched Recently"] || []).map((entry) => mapLead(entry, "Held - Touched Recently")).filter(isAndreVisible);
  const bookedOrClosed = (latestSnapshot.sections["Booked / Closed Monitor"] || []).map((entry) => mapLead(entry, "Booked / Closed Monitor")).filter(isAndreVisible);
  const archiveReview = (latestSnapshot.sections["Archive Review"] || []).map((entry) => mapLead(entry, "Dormant Review")).filter(isAndreVisible);
  const weakContextReview = (latestSnapshot.sections["Weak Context Review"] || []).map((entry) => mapLead(entry, "Weak Context Review")).filter(isAndreVisible);
  const notYours = (latestSnapshot.sections["Not Yours"] || []).map((entry) => mapLead(entry, "Not Yours"));
  const recentAssignments = (latestSnapshot.sections["Recently assigned to Andre"] || []).map((entry) => mapLead(entry, "Recently assigned to Andre")).filter(isAndreVisible);
  const cadenceQueue = dedupeByLead(
    recentCadenceEntries(recentAssignments).map((entry) => ({
      ...entry,
      section: "7-Touch Active Cadence",
      cadenceState: deriveCadenceState(entry),
      cadenceStateLabel: cadenceStateLabel(deriveCadenceState(entry)),
    })),
  );
  const cadenceBuckets = {
    ready: cadenceQueue.filter((entry) => entry.cadenceState === "ready"),
    waiting: dedupeByLead([
      ...cadenceQueue.filter((entry) => entry.cadenceState === "waiting"),
      ...holdRecentTouch.map((entry) => ({
        ...entry,
        section: "7-Touch Active Cadence",
        cadenceState: "waiting",
        cadenceStateLabel: cadenceStateLabel("waiting"),
      })),
    ]),
    review: cadenceQueue.filter((entry) => entry.cadenceState === "review"),
  };
  const cadenceControl = buildCadenceControl(cadenceQueue, latestSnapshot.tasting_target);
  const rollovers = (latestSnapshot.sections["End-of-Day Rollovers"] || []).map((entry) => mapLead(entry, "End-of-Day Rollovers"));
  const callSlots = latestSnapshot.sections["Today Call Slots"] || [];

  const slackWatch = await loadOptionalJson(slackWatchFile);
  const cadenceSenderState = await loadOptionalJson(cadenceSenderStateFile);
  const inboxReaderState = await loadOptionalJson(inboxReaderStateFile);
  const tastingCloserState = await loadOptionalJson(tastingCloserStateFile);
  const slackReplyNow = (slackWatch?.replyNow || []).map((entry) => mapSlackItem(entry, "Slack Reply Now"));
  const slackAssigned = (slackWatch?.assignedToAndre || []).map((entry) => mapSlackItem(entry, "Slack Assigned To Andre"));
  const slackMentions = (slackWatch?.mentions || []).map((entry) => mapSlackItem(entry, "Slack Mentions"));
  const slackUrgent = (slackWatch?.urgent || []).map((entry) => mapSlackItem(entry, "Slack Urgent"));

  const focus = dedupeFocusItems([
    ...slackReplyNow.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.channelLabel} · reply now`, weight: 420 + item.score })),
    ...slackAssigned.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.channelLabel} · assigned to Andre`, weight: 380 + item.score })),
    ...slackMentions.slice(0, 3).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.channelLabel} · Andre mentioned`, weight: 340 + item.score })),
    ...replies.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.recommendedAction} · reply now`, weight: 320 + item.score })),
    ...callPushes.slice(0, 6).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.bestCallSlot || "call"} · ${item.recommendedLane}`, weight: 260 + item.score })),
    ...tastingPushes.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${latestSnapshot.tasting_target || "next tasting"} · ${item.recommendedLane}`, weight: 220 + item.score })),
    ...cadenceBuckets.ready.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.assignmentFreshness} · ${item.cadenceStateLabel}`, weight: 180 + item.score })),
    ...nurtureQueue.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.cadenceStep || "nurture"} · ${item.recommendedLane}`, weight: 120 + item.score })),
  ])
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12);

  const missionFocus = slackReplyNow.length
    ? "Inbox Reader goes first, then Call Booker should lock the live reply into a real conversation."
    : callPushes.length
      ? "Call Booker goes first, then Cadence Sender keeps the rest of Andre's fresh assignments moving."
      : cadenceControl.summary.touch1
        ? "New Andre-owned assignments are ready for Touch 1: first NEPQ email, phone-first."
        : cadenceControl.summary.touch2
          ? "Touch 2 is due: phone-first, then push the next tasting window."
      : cadenceBuckets.ready.length
        ? "Cadence Sender owns the floor: keep every fresh Andre assignment moving without letting the line go cold."
        : tastingPushes.length
          ? "Tasting Closer should drive the next tasting wave while Call Booker protects open slots."
          : "Reply first, push the right people to a call, then drive the next tasting window without forcing weak context.";

  const comparison = buildComparison(latestSnapshot, morningLoaded?.payload || null);
  const squad = buildSquadAssignments({
    slackReplyNow,
    replies,
    callPushes,
    tastingPushes,
    cadenceQueue,
    cadenceControl,
    cadenceBuckets,
    archiveReview,
    holdRecentTouch,
    weakContextReview,
    doNotTouch,
    callSlots,
    tastingTarget: latestSnapshot.tasting_target,
    cadenceSenderState,
    inboxReaderState,
    tastingCloserState,
  });
  const payload = {
    generated_at: latestSnapshot.generated_at,
    checkpoint: latestSnapshot.checkpoint,
    source_file: latestLoaded.name,
    source_label: "LIVE",
    missionFocus,
    summary: {
      totalLeads: latestSnapshot.summary.total_leads,
      hot: latestSnapshot.summary.hot,
      warm: latestSnapshot.summary.warm,
      cold: latestSnapshot.summary.cold,
      drafted: latestSnapshot.summary.drafted,
      skipped: latestSnapshot.summary.skipped,
      repliesOwedNow: latestSnapshot.summary.replies_owed_now || replies.length,
      callPushes: latestSnapshot.summary.call_pushes || callPushes.length,
      tastingPushes: latestSnapshot.summary.tasting_pushes || tastingPushes.length,
      nurtureQueue: latestSnapshot.summary.nurture_queue || nurtureQueue.length,
      holdRecentTouch: latestSnapshot.summary.hold_recent_touch || holdRecentTouch.length,
      bookedOrClosed: latestSnapshot.summary.booked_or_closed || bookedOrClosed.length,
      archiveReview: latestSnapshot.summary.archive_review || archiveReview.length,
      weakContextReview: latestSnapshot.summary.weak_context_review || weakContextReview.length,
      notYours: latestSnapshot.summary.not_yours || notYours.length,
      openCallSlotsToday: latestSnapshot.summary.open_call_slots_today || callSlots.filter((slot) => slot.status === "open").length,
      recentlyAssigned: latestSnapshot.summary.recently_assigned || recentAssignments.length,
      activeCadence: cadenceQueue.length,
      cadenceReadyForAutomation: cadenceControl.summary.readyForAutomation,
      cadenceTouch1: cadenceControl.summary.touch1,
      cadenceTouch2: cadenceControl.summary.touch2,
      cadenceWaiting: cadenceControl.summary.waiting,
      cadencePreTastingCall: cadenceControl.summary.preTastingCall,
      doNotTouch: doNotTouch.length,
      slackReplyNow: slackReplyNow.length,
      slackAssignedToAndre: slackAssigned.length,
      slackMentions: slackMentions.length,
    },
    tastingTarget: latestSnapshot.tasting_target,
    topFocus: focus,
    crm: {
      repliesOwedNow: replies,
      callPushQueue: callPushes,
      tastingPushQueue: tastingPushes,
      nurtureQueue,
      cadenceBuckets,
      cadenceControl,
      doNotTouch,
      holdRecentTouch,
      bookedOrClosed,
      archiveReview,
      weakContextReview,
      notYours,
      activeCadence: cadenceQueue,
      recentlyAssigned: recentAssignments,
      callSlots,
      endOfDayRollovers: rollovers,
    },
    slack: {
      available: Boolean(slackWatch),
      sourceLabel: slackWatch?.source_label || "UNAVAILABLE",
      heartbeatMinutes: slackWatch?.heartbeatMinutes || null,
      workspace: slackWatch?.workspace || null,
      summary: slackWatch?.summary || {
        totalSignals: 0,
        replyNow: 0,
        assignedToAndre: 0,
        andreMentions: 0,
        tastingSignals: 0,
        cadenceExceptions: 0,
        watchedChannels: 0,
      },
      urgent: slackUrgent,
      replyNow: slackReplyNow,
      assignedToAndre: slackAssigned,
      mentions: slackMentions,
      tastingSignals: slackWatch?.tastingSignals || [],
      cadenceExceptions: slackWatch?.cadenceExceptions || [],
      channelHealth: slackWatch?.channelHealth || [],
    },
    squad,
    comparison,
  };

  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, JSON.stringify(payload, null, 2));
  process.stdout.write(`${targetFile}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
