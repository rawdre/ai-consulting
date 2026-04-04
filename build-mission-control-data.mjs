import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const outputDir = path.join(root, "close_guardrail", "output");
const projectFile = path.join(root, "mission-control-data", "projects.json");
const targetFile = path.join(root, "mission-control-data", "latest.json");

function toCloseUrl(leadId) {
  return `https://app.close.com/lead/${leadId}/`;
}

function priorityWeight(priority) {
  return { high: 100, medium: 60, low: 30 }[priority] || 40;
}

async function pickLatestMorningSnapshot() {
  const files = await fs.readdir(outputDir);
  const candidates = files.filter((name) => /^\d{4}-\d{2}-\d{2}-morning\.json$/.test(name)).sort();
  if (candidates.length === 0) {
    throw new Error("No morning snapshot JSON files were found in close_guardrail/output.");
  }
  return path.join(outputDir, candidates[candidates.length - 1]);
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
    stage: entry.opportunityStatus || entry.stage || "",
    nextStepDue: entry.nextStepDue || null,
    rationale: entry.rationale || [],
    link: toCloseUrl(entry.leadId),
  };
}

function projectItem(project) {
  return {
    type: "project",
    title: project.name,
    lane: project.lane,
    status: project.status,
    nextAction: project.nextAction,
    priority: project.priority,
    owner: project.owner,
    link: project.link,
    weight: priorityWeight(project.priority),
  };
}

async function main() {
  const snapshotPath = await pickLatestMorningSnapshot();
  const snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
  const projects = JSON.parse(await fs.readFile(projectFile, "utf8"));

  const replies = (snapshot.sections["Replies owed now"] || []).map((entry) => mapLead(entry, "Replies owed now"));
  const followUps = (snapshot.sections["Follow-ups due today"] || []).map((entry) => mapLead(entry, "Follow-ups due today"));
  const hot = (snapshot.sections["Hot leads at risk"] || []).map((entry) => mapLead(entry, "Hot leads at risk"));
  const warm = (snapshot.sections["Warm nurture candidates"] || []).map((entry) => mapLead(entry, "Warm nurture candidates"));

  const focus = [
    ...followUps.slice(0, 4).map((item) => ({ ...item, title: item.leadName, subtitle: item.recommendedAction, weight: 220 + item.score })),
    ...hot.slice(0, 6).map((item) => ({ ...item, title: item.leadName, subtitle: item.recommendedAction, weight: 180 + item.score })),
    ...projects.map(projectItem),
  ]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  const payload = {
    generated_at: snapshot.generated_at,
    checkpoint: snapshot.checkpoint,
    source_file: path.basename(snapshotPath),
    summary: {
      totalLeads: snapshot.summary.total_leads,
      hot: snapshot.summary.hot,
      warm: snapshot.summary.warm,
      cold: snapshot.summary.cold,
      drafted: snapshot.summary.drafted,
      skipped: snapshot.summary.skipped,
      followUpsDueToday: followUps.length,
      repliesOwedNow: replies.length,
      activeProjects: projects.length,
      highPriorityProjects: projects.filter((project) => project.priority === "high").length,
    },
    topFocus: focus,
    crm: {
      repliesOwedNow: replies,
      followUpsDueToday: followUps,
      hotLeadsAtRisk: hot,
      warmNurtureCandidates: warm.slice(0, 12),
    },
    projects,
  };

  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, JSON.stringify(payload, null, 2));
  process.stdout.write(`${targetFile}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
