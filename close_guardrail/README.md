# Close Revenue Guardrail

This module implements the recurring Close revenue guardrail sweeps for Andre-owned leads.

## What It Does

- Pulls Close leads, tasks, and activity into one scoring pass
- Classifies every lead as `Hot`, `Warm`, or `Cold`
- Detects who is waiting on Andre vs. who needs proactive follow-up
- Drafts NEPQ-style reply, follow-up, reactivation, and tasting-invite messages
- Resolves a lead by name and can create a live Close email or SMS draft, or send it live on command
- Builds ballpark quote drafts with fixed tax/admin/service rules for Comeketo pricing
- Appends Andre's standard email signature automatically to outgoing email drafts and sends
- Writes normalized JSON and Markdown reports for each sweep
- Writes an audit log with `drafted`, `skipped`, and `rolled` status
- Optionally rolls overdue Close tasks to the next business day when the mutation gate is enabled
- Prepares Google Calendar events in operator-assisted mode when direct calendar writes are flaky or too limited

## Checkpoints

- `morning` -> `9:00 AM America/New_York`
- `heartbeat` -> `1:00 PM America/New_York`
- `eod` -> `6:30 PM America/New_York`

## Environment

- `CLOSE_API_KEY` -> required for live Close mode
- `CLOSE_API_BASE_URL` -> optional, defaults to `https://api.close.com/api/v1/`
- `CLOSE_OWNER_NAME` -> defaults to `Andre`
- `CLOSE_OWNER_ID` -> optional, avoids owner-name lookup ambiguity
- `CLOSE_TASTING_WINDOWS` -> optional JSON array of tasting slots
- `CLOSE_TASTING_WINDOWS_FILE` -> optional JSON file path containing the same array
- `CLOSE_GUARDRAIL_OUTPUT_DIR` -> optional output directory override
- `CLOSE_GUARDRAIL_ALLOW_TASK_MUTATIONS=1` -> required in addition to `--allow-rollover` before task dates are updated in Close
- `CLOSE_GUARDRAIL_MAX_LEADS` -> optional live smoke-test cap
- `CLOSE_GUARDRAIL_EMAIL_SENDER` -> optional sender override such as `"Andre Raw" <team@comeketocatering.com>`
- `CLOSE_GUARDRAIL_SMS_LOCAL_PHONE` -> optional explicit Close number to use for outbound SMS

The runner auto-loads an ignored `.env.close` file from the workspace root, so scheduled automations can use Close credentials without putting secrets into tracked files or automation prompts.

## Usage

Fixture mode:

```powershell
node publish-ai-consulting\close_guardrail\close_guardrail.mjs `
  --snapshot publish-ai-consulting\close_guardrail\fixtures\sample_snapshot.json `
  --checkpoint morning `
  --force-run
```

Live mode:

```powershell
$env:CLOSE_API_KEY = "..."
$env:CLOSE_OWNER_NAME = "Andre Raw"
node publish-ai-consulting\close_guardrail\close_guardrail.mjs --checkpoint morning
```

Enable task rollover mutations during the end-of-day sweep:

```powershell
$env:CLOSE_GUARDRAIL_ALLOW_TASK_MUTATIONS = "1"
node publish-ai-consulting\close_guardrail\close_guardrail.mjs --checkpoint eod --allow-rollover
```

Create a Close draft message for a lead by name:

```powershell
node publish-ai-consulting\close_guardrail\close_guardrail.mjs `
  --mode message `
  --lead-name "Ashley Wood" `
  --channel email
```

Send the message live instead of saving a draft:

```powershell
node publish-ai-consulting\close_guardrail\close_guardrail.mjs `
  --mode message `
  --lead-name "Ashley Wood" `
  --channel sms `
  --send-live
```

Override the generated message:

```powershell
node publish-ai-consulting\close_guardrail\close_guardrail.mjs `
  --mode message `
  --lead-name "Ashley Wood" `
  --channel email `
  --subject "Quick next step" `
  --body "Hi Ashley, would it be better to jump on a quick call or should I save you a spot for Sunday’s tasting?"
```

Portuguese guardrail:

- Portuguese messages can be drafted, but the runtime blocks live sending for them.

Create a ballpark quote draft for a lead:

```powershell
node publish-ai-consulting\close_guardrail\close_guardrail.mjs `
  --mode quote `
  --lead-name "Tamika Noiles" `
  --quote-tier "Tier 1|36.90|2 meats, 3 sides, and 1 salad" `
  --quote-tier "Tier 2|41.90|3 meats, 3 sides, and 1 salad"
```

Quote rules baked into `quote` mode:

- Always uses `Ballpark` language in the subject/body
- If a lead gives a guest range like `20-50`, the default quote uses the highest number (`50`)
- Always shows Food, Appetizers, MA Tax (7%), Service/Fuel/Admin (24%), Service Charge, and Ballpark Total
- Buffet/churrasco service charge is `$150` up to 50 guests, then `$3/pp`
- Plated/family service charge is always `$3/pp`
- Default steak is `Top Sirloin`
- Default chicken is `Chicken Wrapped in Bacon`
- Complimentary cookies are always mentioned

Calendar workflow rules:

- Calendar requests are handled in operator-assisted mode by default: gather the live Close details, prepare the exact event payload, and open a prefilled Google Calendar page for final save when needed.
- Do not claim a calendar event is fully set unless the Google Calendar tool actually returns a created event ID.
- Catering events use this title pattern:
  - `{Food}` or `{Food&Bar}`, client name, event type, guest count, city/state, and append `(time TBD)` if start time is still unconfirmed.
- Tasting events use this title pattern:
  - `Lead Name PAX <top-end guest count> Tasting`
- For guest-count ranges, use the highest number by default.
- Tasting pattern:
  - location `199 Main St, Fitchburg, MA 01420, USA`
  - include the Close lead link in the description
  - include `bibi@comeketo.com` plus the lead guest email when available
  - operator should save it on `Catering Tastings`, which carries the red color pattern in Google Calendar
- Catering-event pattern:
  - operator should save it on `Catering Events`
  - description should include Close link, service type, quote/spreadsheet placeholder if needed, attached-doc placeholder if needed, and contact phone numbers
