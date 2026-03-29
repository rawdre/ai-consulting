import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const eventsPath = path.join(repoRoot, 'mission-control-events.jsonl');
const outputPath = path.join(repoRoot, 'mission-control-data.json');

if (!fs.existsSync(eventsPath)) {
  console.error(`Missing event log: ${eventsPath}`);
  process.exit(1);
}

const lines = fs.readFileSync(eventsPath, 'utf8').split(/\r?\n/).filter(Boolean);
const events = lines.map(line => JSON.parse(line)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

const tasksCompleted = events.reduce((sum, evt) => sum + (evt.metricsDelta?.tasksCompleted || 0), 0);
const quotesSent = events.filter(evt => evt.eventType === 'close.quote.sent').length;
const inboxTasksCleared = events.filter(evt => evt.eventType === 'close.inbox.cleaned').length;

const latestByActor = new Map();
for (const evt of events) {
  if (!latestByActor.has(evt.actor.key)) latestByActor.set(evt.actor.key, evt);
}

const colorByActor = {
  rawbot: 'cyan',
  ogilvy: 'magenta',
  buffett: 'green',
  cialdini: 'amber',
  turing: 'purple',
  ada: 'magenta'
};
const emojiByActor = {
  rawbot: '🤖',
  ogilvy: '📈',
  buffett: '📊',
  cialdini: '💰',
  turing: '🛡️',
  ada: '🎨'
};

const agents = Array.from(latestByActor.values()).map(evt => ({
  key: evt.actor.key,
  name: evt.actor.name,
  emoji: emojiByActor[evt.actor.key] || '⚙️',
  role: evt.actor.role,
  color: colorByActor[evt.actor.key] || 'cyan',
  status: evt.summary,
  updatedAt: evt.timestamp
}));

const dashboard = {
  meta: {
    version: 2,
    generatedAt: new Date().toISOString(),
    mode: 'live-v2',
    source: 'mission-control-events.jsonl'
  },
  scorecards: [
    { key: 'quotesSent', title: 'Quotes Sent', value: quotesSent, prefix: '', suffix: '', color: 'green', progress: Math.min(quotesSent * 20, 100) },
    { key: 'inboxTasksCleared', title: 'Inbox Clears', value: inboxTasksCleared, prefix: '', suffix: '', color: 'amber', progress: Math.min(inboxTasksCleared * 30, 100) },
    { key: 'tasksCompleted', title: 'Tasks Completed', value: tasksCompleted, prefix: '', suffix: '', color: 'purple', progress: Math.min(tasksCompleted * 10, 100) },
    { key: 'eventsLogged', title: 'Events Logged', value: events.length, prefix: '', suffix: '', color: 'cyan', progress: Math.min(events.length * 10, 100) }
  ],
  agents,
  activities: events.slice(0, 12).map(evt => ({
    time: new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    text: evt.summary
  }))
};

fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2), 'utf8');
console.log(`Wrote ${outputPath}`);
