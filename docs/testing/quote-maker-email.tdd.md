# Quote Maker email — TDD evidence

## Source

Journeys were derived from the September 22, 2026 request to turn a completed
customer menu into the same itemized estimate produced by Comeketo's Quote Maker
and deliver it as a rich HTML email rather than a plain-text note.

## User journeys

- As a customer, I receive a branded, itemized event estimate after completing
  the menu builder so I can review the same totals Comeketo sees.
- As Comeketo, I send the estimate as HTML email content and explicitly mark the
  integration payload as email-only, while retaining plain text only as fallback.
- As a mobile recipient, I can read the estimate without horizontal scrolling.

## RED → GREEN evidence

| Guarantee | Test/evidence | Result |
|---|---|---|
| Quote Maker HTML renderer exists and replaces the plain `<pre>` note layout | `node --test comeketo/menus/package-builder.test.cjs` initially failed because `quoteEmailHTML` and `buildQuoteEmail` did not exist | RED, then PASS |
| Example Quote Maker selection produces subtotal `$10,972.50`, service `$2,633.40`, tax `$952.41`, and total `$14,558.31` | `renders the completed request as a Quote Maker style email instead of a plain-text note` | PASS |
| Payment schedule is `$2,911.66 / $5,095.41 / $4,367.49 / $2,183.75` | Same test | PASS |
| Customer and venue content is HTML-escaped | `quote email escapes customer content and exposes a stable email-only delivery contract` | PASS |
| Payload contract is `email_html` with `createNote=false` | Same test plus `package-builder.js` integration | PASS |
| Estimate has no fixed `width="680"` container | Responsive assertions in the Quote Maker renderer test | PASS |
| Mobile layout has no horizontal overflow | Browser QA at a 390 px viewport: `scrollWidth=375`, `clientWidth=375` | PASS |

## Validation

```text
node --check comeketo/menus/package-core.js
node --check comeketo/menus/package-builder.js
node --test --experimental-test-coverage comeketo/menus/package-builder.test.cjs
```

10 tests passed. Coverage: 96.33% lines, 82.08% branches, 88.89% functions.

## Command Center delivery

The public page posts `customer_quote_html`, `team_notification_html`,
`quote_delivery_mode=email_html`, and `create_note=false` to the Comeketo Command
Center. Its tested receiver creates a Close lead and two HTML email activities,
persists per-step idempotency, resumes partial failures without resending the
customer email, and rejects unsafe relay payloads. No production request or email
was sent during this run, so provider mailbox delivery still requires the user's
controlled live test.
