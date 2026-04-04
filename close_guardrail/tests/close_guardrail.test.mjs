import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildBallparkQuoteEmail,
  buildLeadSignals,
  buildRecommendations,
  buildReport,
  loadSnapshotFromFixture,
  nextBusinessDayIso,
} from "../close_guardrail.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE = path.join(__dirname, "..", "fixtures", "sample_snapshot.json");

async function main() {
  const snapshot = await loadSnapshotFromFixture(FIXTURE);
  const signals = buildLeadSignals(snapshot, "Andre Raw", "user_andre", snapshot.tasting_windows);

  const leadIds = new Set(signals.map((signal) => signal.leadId));
  assert.equal(leadIds.has("lead_hot_reply"), true);
  assert.equal(leadIds.has("lead_warm_tasting"), true);
  assert.equal(leadIds.has("lead_cold_roll"), true);
  assert.equal(leadIds.has("lead_other_owner"), false);

  const morningRecommendations = buildRecommendations(signals, "morning");
  const camila = morningRecommendations.find((item) => item.leadId === "lead_hot_reply");
  assert.equal(camila.statusBucket, "Hot");
  assert.equal(camila.communicationStatus, "no_recent_activity");
  assert.equal(camila.language, "en");
  assert.equal(camila.artifactMode, "draft only");
  assert.equal(camila.recommendedAction, "confirm tasting");

  const heartbeatRecommendations = buildRecommendations(signals, "heartbeat");
  const michael = heartbeatRecommendations.find((item) => item.leadId === "lead_warm_tasting");
  assert.ok(["Hot", "Warm"].includes(michael.statusBucket));
  assert.equal(michael.recommendedAction, "invite to tasting");

  const eodRecommendations = buildRecommendations(signals, "eod");
  const laura = eodRecommendations.find((item) => item.leadId === "lead_cold_roll");
  assert.equal(laura.recommendedAction, "reactivate");
  assert.equal(nextBusinessDayIso("2026-03-27"), "2026-03-30");

  const report = buildReport(morningRecommendations, "morning", "Andre Raw", "user_andre");
  assert.equal(report.summary.total_leads, 3);
  assert.ok("Replies owed now" in report.sections);
  assert.ok("Tasks rolled to next business day" in report.sections);

  const quote = buildBallparkQuoteEmail(
    {
      display_name: "Tamika Noiles",
      description: "20-50\nBirthday",
      opportunities: [
        {
          custom: {
            cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP: "2026-04-03T15:00:00+00:00",
          },
        },
      ],
    },
    {
      quoteTiers: [
        "Tier 1|36.90|2 meats, 3 sides, and 1 salad",
        "Tier 2|41.90|3 meats, 3 sides, and 1 salad",
      ],
      quoteServiceStyle: "buffet",
    },
  );
  assert.match(quote.subject, /Ballpark quote/i);
  assert.deepEqual(quote.guestCounts, [50]);
  assert.match(quote.body, /Food: \$36\.90 x 50 = \$1845\.00/);
  assert.match(quote.body, /MA Tax \(7%\): \$129\.15/);
  assert.match(quote.body, /Service, Fuel & Admin \(24%\): \$442\.80/);
  assert.match(quote.body, /Service Charge \(50 guests or fewer\): \$150\.00/);
  assert.match(quote.body, /Ballpark Total: ~\$2566\.95/);
  assert.match(quote.body, /Top Sirloin/);
  assert.match(quote.body, /Chicken Wrapped in Bacon/);
  assert.match(quote.body, /Complimentary cookies are included/);
  assert.match(quote.body, /Regards,/);
  assert.match(quote.body, /Andre Raw/);
  assert.match(quote.body, /Catering Event Coordinator/);

  const funQuote = buildBallparkQuoteEmail(
    {
      display_name: "Tamika Noiles",
      description: "20-50\nBirthday",
      opportunities: [
        {
          custom: {
            cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP: "2026-04-03T15:00:00+00:00",
          },
        },
      ],
    },
    {
      quoteTiers: ["Tier 1|36.90|2 meats, 3 sides, and 1 salad"],
      quoteTone: "fun",
    },
  );
  assert.match(funQuote.subject, /Fun ballpark quote/i);
  assert.match(funQuote.body, /🍽️/);
  assert.match(funQuote.body, /🍪/);
  assert.match(funQuote.body, /vibe/i);
  assert.match(funQuote.body, /Regards,/);

  const simpleQuote = buildBallparkQuoteEmail(
    {
      display_name: "Yolanda",
      description: "People 40\nEvent Desc: Wedding\nEvent Date: May 2,2026",
      custom: {
        "Date of Event": "2026-05-02T16:00:00+00:00",
      },
      opportunities: [],
    },
    {
      quoteTiers: ["Tier 1|36.90|2 meats, 3 sides, and 1 salad"],
      quoteTone: "fun",
    },
  );
  assert.deepEqual(simpleQuote.guestCounts, [40]);
  assert.match(simpleQuote.subject, /May 2, 2026/);
  assert.match(simpleQuote.body, /your wedding/i);
  assert.match(simpleQuote.body, /Tier 1 \(40 guests\)/);

  const labeledDateQuote = buildBallparkQuoteEmail(
    {
      display_name: "Carlos Albelo",
      description: "People 14\nEvent Desc: Wedding\nEvent Date: 4/13/2026",
      custom: {},
      opportunities: [],
    },
    {
      quoteTiers: ["Tier 1|36.90|2 meats, 3 sides, and 1 salad"],
      quoteGuests: "14",
      quoteTone: "fun",
    },
  );
  assert.match(labeledDateQuote.subject, /April 13, 2026/);
  assert.match(labeledDateQuote.body, /Tier 1 \(14 guests\)/);

  process.stdout.write("close_guardrail tests passed\n");
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
