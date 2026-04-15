# Hosted Mission Control

## Source of truth

The hosted cockpit should trust Close ownership, not Slack assignment alone.

Lead flow:

1. Slack detects that a lead was assigned to Andre.
2. Close confirms the lead owner is Andre.
3. Only after Close confirms Andre ownership does the 7-day cadence become active.

## Cadence model

The hosted payload now exposes a cadence control plane:

- `touch_1_call_probe`
  - first NEPQ email
  - phone-first
- `touch_2_call_plus_tasting`
  - second touch
  - phone-first plus tasting CTA
- `touch_n_follow_up`
  - deeper seven-day cadence follow-up
- `waiting_on_reply`
  - do not send again
  - wait for response and hand to Inbox Reader
- `call_booked`
  - get the call onto Andre's calendar
- `pre_tasting_call_required`
  - tasting is booked or committed
  - mandatory pre-tasting expectations call
- `stopped`
  - wrong owner
  - touched today
  - lost/disqualified
  - call booked
  - tasting booked

## Hosted routes

- `/`
  - Mission Control live cockpit
- `/mission-control-data/latest.json`
  - cockpit payload
- `/api/status`
  - server and agent runtime status
- `/api/refresh`
  - force refresh the dashboard payload
- `/api/agents/inbox-reader/run`
- `/api/agents/cadence-sender/run`
- `/api/agents/tasting-closer/run`
- `/oracle-enrichment-dossier.html`
- `/mission-control-andre1.html`

## Agent behavior

### Inbox Reader

- reads live inbound context
- prepares the next reply
- should own reply-now work

### Cadence Sender

- reads `crm.cadenceControl.readyForAutomation`
- drafts or sends based on `CADENCE_SENDER_SEND_LIVE`
- touch 1 = phone-first
- touch 2 = phone plus tasting

### Tasting Closer

- handles tasting-ready leads
- uses the richer tasting block with preview and registration buttons

## Deployment

The repo now includes:

- `Dockerfile`
- `render.yaml`

This is the intended hosted stack for Render because the web service needs:

- Python for `server.py`
- Node for `refresh-mission-control.mjs` and the lane agents

## Required environment

- `CLOSE_API_KEY`
- optional: `CLOSE_API_BASE_URL`
- optional: `CLOSE_OWNER_NAME`
- optional: `CLOSE_OWNER_ID`
- optional: `SLACK_BOT_TOKEN`
- optional: `CLOSE_NEXT_TASTING_LABEL`
- optional: `CLOSE_TASTING_LOCATION`
- optional: `CLOSE_TASTING_REGISTRATION_URL`
- optional: `CLOSE_TASTING_PREVIEW_URL`
- optional: `CADENCE_SENDER_SEND_LIVE`

## Important guardrails

- Never send if the lead is not clearly Andre-owned.
- Do not send duplicate emails.
- If tasting is in the email, use the richer HTML tasting block.
- Quote + tasting should be one combined email.
- After a touch, roll the task forward unless the user explicitly says to kill it.
