# Rawbot Backup — 2026-04-28

Crafted by André + Rawbot

## Purpose

Preserve the most reusable operational work built around Comeketo CRM, Mission Control, inbox guardrails, and operator memory so it survives thread loss and can be reloaded into future agent sessions.

This is not a raw chat dump.

It is a curated backup of live operating rules, memory, and system behavior that proved useful in real work.

## What was materially established

### 1. Close ownership and send boundaries

- Source of truth for whether a lead can be touched:
  - `LEAD OWNER = 01. 😎 Andre`
- If the lead is not André-owned:
  - do not send
  - do not move as if it was worked
  - hold unless André explicitly overrides
- `Won` and `Lost` are no-touch for outbound unless André explicitly overrides

### 2. Language rule

- Default customer-facing language is `English`
- Do not send Portuguese or Spanish unless André explicitly asks
- Do not infer language from the lead's name or background

### 3. NEPQ operating line

Customer-facing style should stay aligned with:

- ask instead of pitch
- calm, grounded tone
- pull for clarity
- aim for a response

The practical target order is:

1. get the lead on the phone with André
2. if phone does not move first, open the door to the next tasting

### 4. Tasting cycle is operator-fed

Tasting dates are not hardcoded forever.

Current known cycle at the time of this backup:

- `Sunday, May 3, 2026 at 5:30 PM`
- `Sunday, May 17, 2026 at 2:00 PM`
- `Sunday, May 31, 2026 at 2:00 PM`

Operational rule:

- never invent tasting dates
- never carry stale dates forward
- André feeds the active dates for the current cycle

### 5. April 19 failure and correction

One important failure pattern was discovered:

- old HTML tasting blocks kept leaking `Sunday, April 19`

That date is off the map and must not be used again.

The deeper lesson is more important than the date:

- relative or stale calendar defaults are dangerous
- current tasting dates must always be operator-fed and current-cycle specific

### 6. Calendar booking standard for tastings

When a tasting is booked for André:

- calendar must be `Catering Tastings`
- event color must be `red`
- title format:
  - `Lead Name Tasting`
  - or `Lead Name PAX X Tasting`
- location:
  - `199 Main St, Fitchburg, MA 01420, USA`
- event description should include:
  - Close lead link
  - lead email
  - lead phone
  - event type
  - guest count
  - event date
- attendees should include:
  - `bibi@comeketo.com`
  - lead email when available

### 7. Ballpark quote rules

For catering quotes:

- email is HTML-first
- quote should include calculator button
- quote + tasting invite = one combined email when both are part of the move
- default quote language should clearly say `ballpark`

Working default package logic:

- `Full Churrasco`
- `Deluxe Churrasco`

Guest count rule:

- use actual guest count when present
- if range exists, usually use the top end for the ballpark
- if missing and André gives a base, use that
- known fallback base used in practice:
  - `50 guests`

### 8. Bar-only quote template was locked in

A new bar-service-only quote structure was approved and should be reused.

File:

- `close_guardrail/templates/BAR-ONLY-BALLPARK-TEMPLATE.md`

Important characteristics:

- rich HTML visual
- strong bar header image
- multiple bar tiers
- real bar pricing instead of invented numbers
- optional tasting footer, not mandatory

Locked pricing shape for the template:

- `Standard Cash Bar`
  - `$6.50/pp + $150 setup`
- `Open Bar: Beer & Wine`
  - `$22.00/pp + $150 setup`
- `Beer & Wine + 3 Signature Drinks`
  - `$27.00/pp + $150 setup`
- `Open Bar: Full Bar`
  - `$30.00/pp + $150 setup`
- `Full Bar + 2 Signature Drinks`
  - `$35.00/pp + $150 setup`

### 9. Task movement rules

Operational task rule:

- if we touched it today, move the task to tomorrow unless André gave another day

Weekend rule:

- if André is working the weekend:
  - Friday -> Saturday
  - Saturday -> Sunday
- if André is not working the weekend:
  - Friday -> Monday

If André says a specific day such as:

- `move to Wednesday`
- `I come back Wednesday`

use that explicit instruction.

### 10. Read before sending

Do not generate outbound from thin air.

Before sending:

- read recent thread context
- check current opportunity status
- inspect last three relevant communications when possible
- if there was an answered phone call over `5 minutes`, use that as a research anchor

If transcript is visible, use it.
If transcript is not exposed, use the nearby call note and thread context.

### 11. Reports are mandatory

A run without a readable report is incomplete.

Reports should state:

- what was sent
- what was skipped
- why it was skipped
- what failed
- which tasks moved

Useful report locations used in this system:

- `.cache/manual-control/`
- `.cache/agent-control/`

### 12. Mission Control system state

The Comeketo operation is increasingly centered on:

- Mission Control dashboard
- guardrail-driven Close sending
- lane agents such as:
  - Inbox Reader
  - Cadence Sender
  - Tasting Closer

The next major lane to formalize is:

- `Call Booker`

Its purpose is to turn agreed phone-call times into real calendar action.

## Important files worth rereading first

- `close_guardrail/close_guardrail.mjs`
- `close_guardrail/COMEKETO-PRICING-HUB.md`
- `close_guardrail/templates/comeketo-ballpark-template.html`
- `close_guardrail/templates/BAR-ONLY-BALLPARK-TEMPLATE.md`
- `mission-control-live.html`
- `mission-control-data/latest.json`
- `cadence-sender-agent.mjs`
- `inbox-reader-agent.mjs`
- `tasting-closer-agent.mjs`

## Note

This backup is meant to preserve operator-grade memory:

- what actually worked
- what broke
- what rules became non-negotiable

It should be safe to reuse in future agent sessions without exposing secrets.
