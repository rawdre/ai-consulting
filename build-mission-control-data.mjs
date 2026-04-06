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

function toCloseUrl(leadId) {
  return `https://app.close.com/lead/${leadId}/`;
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
    cadenceActive: Boolean(entry.cadenceActive),
    assignmentFreshness: entry.assignmentFreshness || "older",
    bestCallSlot: entry.bestCallSlot || null,
    secondBestCallSlot: entry.secondBestCallSlot || null,
    link: toCloseUrl(entry.leadId),
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
    link: entry.link || null,
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

function toSquadItem(entry, owner, status, nextMove) {
  return {
    item: entry.leadName,
    reason: entry.whyNow || entry.rationale?.[0] || "Needs operator review.",
    nextMove: nextMove || entry.reviewNextStep || "Review lead context before acting.",
    owner,
    status,
    leadId: entry.leadId,
    link: entry.link || toCloseUrl(entry.leadId),
    lane: entry.recommendedLane,
    stage: entry.stage || "",
    bestCallSlot: entry.bestCallSlot || null,
    assignmentFreshness: entry.assignmentFreshness || null,
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

function buildSquadAssignments({
  replies,
  callPushes,
  tastingPushes,
  nurtureQueue,
  archiveReview,
  weakContextReview,
  bookedOrClosed,
  notYours,
  recentAssignments,
  callSlots,
  tastingTarget,
}) {
  const rawAiItems = dedupeByItem([
    ...replies.slice(0, 4).map((entry) =>
      toSquadItem(entry, "Raw AI", "reply_now", "Read the thread, then draft the clearest next reply."),
    ),
    ...callPushes.slice(0, 4).map((entry) =>
      toSquadItem(
        entry,
        "Raw AI",
        "call_push",
        `Review comms and push toward ${entry.bestCallSlot || "the best open call slot"} without forcing.`,
      ),
    ),
    ...tastingPushes.slice(0, 3).map((entry) =>
      toSquadItem(
        entry,
        "Raw AI",
        "tasting_push",
        `Use current context and move the lead toward ${tastingTarget || "the next tasting window"}.`,
      ),
    ),
    ...nurtureQueue.slice(0, 3).map((entry) =>
      toSquadItem(entry, "Raw AI", "nurture_review", "Decide whether this stays nurture or graduates to call/tasting."),
    ),
  ]).slice(0, 8);

  const acerbotCandidates = dedupeByItem([
    ...tastingPushes.map((entry) =>
      toSquadItem(
        entry,
        "Acerbot",
        "draft_queue",
        `Build the best revenue draft for ${tastingTarget || "the next tasting"} from inside the VM sandbox.`,
      ),
    ),
    ...nurtureQueue.map((entry) =>
      toSquadItem(
        entry,
        "Acerbot",
        "draft_queue",
        "Prepare NEPQ call/tasting follow-up copy so Andre only has to review and send.",
      ),
    ),
    ...recentAssignments
      .filter((entry) => entry.holdBucket === "active_work")
      .map((entry) =>
        toSquadItem(
          entry,
          "Acerbot",
          "research_ready",
          "Prep quote, tasting, or call-support language without touching live CRM directly.",
        ),
      ),
  ]).slice(0, 8);

  const lenoItems = dedupeByItem([
    ...archiveReview.map((entry) =>
      toSquadItem(entry, "LenoRawbot", "archive_review", "Clean the history and decide archive vs dormant hold."),
    ),
    ...weakContextReview.map((entry) =>
      toSquadItem(entry, "LenoRawbot", "context_repair", "Investigate missing context and make the lead safe to review."),
    ),
    ...bookedOrClosed.map((entry) =>
      toSquadItem(entry, "LenoRawbot", "monitor_only", "Keep this out of outreach and clean up task noise or status drift."),
    ),
    ...notYours.slice(0, 4).map((entry) =>
      toSquadItem(entry, "LenoRawbot", "ownership_audit", "Check ownership and route it out of Andre’s command lane."),
    ),
  ]).slice(0, 8);

  const slotCoverage = callSlots
    .filter((slot) => slot.status === "open")
    .slice(0, 3)
    .map((slot) => ({
      item: `${slot.slot} call slot`,
      reason: slot.fallbackCandidates?.length
        ? `${slot.fallbackCandidates[0].leadName} is the strongest current fallback candidate.`
        : "No strong candidate has been assigned yet.",
      nextMove: slot.fallbackCandidates?.length
        ? `Have Raw AI review ${slot.fallbackCandidates[0].leadName} before filling this slot.`
        : "Leave open until a real call-worthy lead appears.",
      owner: "Raw AI",
      status: slot.fallbackCandidates?.length ? "slot_open" : "slot_idle",
      leadId: slot.fallbackCandidates?.[0]?.leadId || null,
      link: slot.fallbackCandidates?.[0]?.leadId ? toCloseUrl(slot.fallbackCandidates[0].leadId) : null,
      lane: "call_slot",
      stage: slot.status,
      bestCallSlot: slot.slot,
      assignmentFreshness: null,
    }));

  return {
    rawAi: {
      title: "Raw AI Operator Queue",
      environment: "Local workstation",
      focus: "Own the live cockpit, highest-priority routing, and call-slot decisions.",
      items: dedupeByItem([...rawAiItems, ...slotCoverage]).slice(0, 8),
    },
    acerbot: {
      title: "Acerbot Revenue Work",
      environment: "VM sandbox",
      focus: "Build revenue drafts, tasting pushes, and quote-support work without touching live CRM directly.",
      items: acerbotCandidates,
    },
    lenoRawbot: {
      title: "LenoRawbot Cleanup & Structure",
      environment: "Local workstation",
      focus: "Clean archive, ownership, and blocked-queue structure so Andre’s lane stays clean.",
      items: lenoItems,
    },
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
  const replies = (latestSnapshot.sections["Replies owed now"] || []).map((entry) => mapLead(entry, "Replies owed now"));
  const callPushes = (latestSnapshot.sections["Call Push Queue"] || []).map((entry) => mapLead(entry, "Call Push Queue"));
  const tastingPushes = (latestSnapshot.sections["Tasting Push Queue"] || []).map((entry) => mapLead(entry, "Tasting Push Queue"));
  const nurtureQueue = (latestSnapshot.sections["Nurture Queue"] || []).map((entry) => mapLead(entry, "Nurture Queue"));
  const doNotTouch = (latestSnapshot.sections["Do Not Touch"] || []).map((entry) => mapLead(entry, "Do Not Touch"));
  const holdRecentTouch = (latestSnapshot.sections["Held - Touched Recently"] || []).map((entry) => mapLead(entry, "Held - Touched Recently"));
  const bookedOrClosed = (latestSnapshot.sections["Booked / Closed Monitor"] || []).map((entry) => mapLead(entry, "Booked / Closed Monitor"));
  const archiveReview = (latestSnapshot.sections["Archive Review"] || []).map((entry) => mapLead(entry, "Archive Review"));
  const weakContextReview = (latestSnapshot.sections["Weak Context Review"] || []).map((entry) => mapLead(entry, "Weak Context Review"));
  const notYours = (latestSnapshot.sections["Not Yours"] || []).map((entry) => mapLead(entry, "Not Yours"));
  const recentAssignments = (latestSnapshot.sections["Recently assigned to Andre"] || []).map((entry) => mapLead(entry, "Recently assigned to Andre"));
  const cadenceQueue = (latestSnapshot.sections["7-Touch Active Cadence"] || []).map((entry) => mapLead(entry, "7-Touch Active Cadence"));
  const rollovers = (latestSnapshot.sections["End-of-Day Rollovers"] || []).map((entry) => mapLead(entry, "End-of-Day Rollovers"));
  const callSlots = latestSnapshot.sections["Today Call Slots"] || [];

  const slackWatch = await loadOptionalJson(slackWatchFile);
  const slackReplyNow = (slackWatch?.replyNow || []).map((entry) => mapSlackItem(entry, "Slack Reply Now"));
  const slackAssigned = (slackWatch?.assignedToAndre || []).map((entry) => mapSlackItem(entry, "Slack Assigned To Andre"));
  const slackMentions = (slackWatch?.mentions || []).map((entry) => mapSlackItem(entry, "Slack Mentions"));
  const slackUrgent = (slackWatch?.urgent || []).map((entry) => mapSlackItem(entry, "Slack Urgent"));

  const focus = [
    ...slackReplyNow.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.channelLabel} · reply now`, weight: 420 + item.score })),
    ...slackAssigned.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.channelLabel} · assigned to Andre`, weight: 380 + item.score })),
    ...slackMentions.slice(0, 3).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.channelLabel} · Andre mentioned`, weight: 340 + item.score })),
    ...replies.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.recommendedAction} · reply now`, weight: 320 + item.score })),
    ...callPushes.slice(0, 6).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.bestCallSlot || "call"} · ${item.recommendedLane}`, weight: 260 + item.score })),
    ...tastingPushes.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${latestSnapshot.tasting_target || "next tasting"} · ${item.recommendedLane}`, weight: 220 + item.score })),
    ...recentAssignments.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.assignmentFreshness} · ${item.recommendedLane}`, weight: 180 + item.score })),
    ...nurtureQueue.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: `${item.cadenceStep || "nurture"} · ${item.recommendedLane}`, weight: 120 + item.score })),
  ]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12);

  const comparison = buildComparison(latestSnapshot, morningLoaded?.payload || null);
  const squad = buildSquadAssignments({
    replies,
    callPushes,
    tastingPushes,
    nurtureQueue,
    archiveReview,
    weakContextReview,
    bookedOrClosed,
    notYours,
    recentAssignments,
    callSlots,
    tastingTarget: latestSnapshot.tasting_target,
  });
  const payload = {
    generated_at: latestSnapshot.generated_at,
    checkpoint: latestSnapshot.checkpoint,
    source_file: latestLoaded.name,
    source_label: "LIVE",
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
