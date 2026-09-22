# Customer catering menu builder

## Quote Maker email (September 22, 2026)

Completed customer selections now generate a numbered `CMK-` estimate with the
same itemized presentation used by the Quote Maker: package tier, extra proteins,
premium charges, appetizers, platters, staffing, subtotal, service/admin, tax,
event total, and the 20/35/30/15 payment schedule. The Command Center request carries
the result in `customer_quote_html` and `team_notification_html`, declares
`quote_delivery_mode=email_html`, and sets `create_note=false`. The success-page
download is the formatted HTML estimate rather than a text-note file.

The rendered example matches `$10,972.50 + $2,633.40 + $952.41 = $14,558.31`
and is responsive without horizontal overflow at a 375 px content viewport.
The form now posts JSON to the Command Center's public, validated receiver. The
receiver creates the Close lead, sends the Quote Builder HTML to the customer,
sends the same estimate plus callback details to the team, and never creates a Note.

## Stripe extension (September 21, 2026)

The review step offers an editable payment of at least 20% or full payment less 3% through a personalized command-center invitation. Generic visitors can request a quote; payment requires the link created from an André-owned lead's quote. The server validates ownership and recalculates all prices, including the rep-confirmed delivery amount. A fragment token is removed from the address bar before third-party widgets load and kept in sessionStorage for the tab. Stripe return restores the saved checkout details and verifies payment with the backend.

`package-payments.js` calls the command center's public options, checkout and status routes. No secret keys are present here. Backend setup is documented in `rawdre/comeketo-command-center/docs/customer-menu-payments.md`. Checkout is disabled until the API and webhook secrets are configured. Live Stripe verification is pending Render dashboard access; do not mistake local preview for a completed payment test.

Browser preview verified the $4,365.17 sample total, $873.04 minimum, editable amount, $4,234.21 full-payment option ($130.96 savings), zero balance on full payment, and retained Crisp chat. Preview cannot send requests or create Checkout sessions.

Local branch: `feature/customer-catering-builder`. The existing tray menu links to
`comeketo/menus/catering-package.html`. Existing tray purchasing behavior is retained.

## Customer experience

Event and service style → dishes → full venue address → contact and callback
permission → editable review → request receipt, or optional Stripe booking payment through a personalized link.
Popular mains appear first; search and “See all” expose the complete catalog.
Selections remain in memory when moving between steps. Personal information is not
written to localStorage. Refreshing the page clears the draft.

Preview: append `?preview=1`; submission is disabled in this mode. Serve locally
with `python -m http.server 8765 --bind 127.0.0.1` from the repository root.

## Pricing source

`package-catalog.js` is a versioned snapshot of `STYLES_MEX`, `MAINS_MEX`,
`SIDES_MEX`, `SALADS_MEX`, `APPS_MEX`, and `BOARDS_MEX` from
`rawdre/comeketo-command-center/quote.html`, retrieved September 21, 2026.
It is NOT a live synchronization. When that catalog changes, review and update
the corresponding object here and rerun the pricing tests before publishing.
The customer calculation follows default package tier selection, premiums,
extra mains/sides/salads, staffing, service fee, drop-off chafers/setup, and tax.
It excludes internal overrides, tasting discounts, and travel/delivery distances.
The UI explicitly identifies travel/delivery as separately quoted.

## Email delivery through Command Center

`POST https://comeketo-command-center.onrender.com/public/customer-menu-quote`
accepts only the Quote Builder contract, a fixed Comeketo team recipient, safe
non-interactive HTML, valid event/contact fields, and a `create_note=false`
delivery mode. New requests are rate-limited. Durable request receipts track the
Close lead, customer email, and team email separately. If the team delivery fails
after the customer message succeeds, an unchanged retry resumes the missing step
without sending the customer message again.

The receipt screen appears only after both Close email activities are accepted.
Errors retain the form. The customer can still download the exact HTML estimate.
One controlled live submission remains the final mailbox-delivery check; no real
customer email was sent during automated verification.

Do not add private email-provider or Close API keys to these public files. The
public form is not a trusted source of final prices. Review estimates against the
command center before issuing a final quote. The receiver enforces rate limiting
and request deduplication.

## Validation / evidence

Journeys derived from the user’s request in this task.

- RED: initial four tests failed because PackageCore did not exist (529c63a).
- RED: receipt test failed because `submit` did not exist (1aa09c6).
- GREEN: `node --test --experimental-test-coverage comeketo/menus/package-builder.test.cjs`
  passes all eight tests. Core coverage: 100% lines/functions, 92% branches.
- Covers catalog tiers across four styles, extras, drop-off minimums, invalid
  selections, date/address/contact requirements, consent, HTML escaping, and
  explicit receiver receipt with network/JSON/error failures mocked locally.
- Browser walkthrough on local preview: required-field block, empty-menu block,
  two mains + a side, address, contact, consent, review, and return-to-edit with
  preserved state. No live submissions.
- Desktop and 390px mobile visual inspection. No prior visual baseline exists;
  visual regression comparison is inconclusive. No formal screen-reader audit.
- No dependencies were added; this static feature has no package manifest and
  no applicable npm dependency audit. Stripe uses the companion command-center backend.

Published on GitHub Pages at the user's request. A controlled live mailbox test remains outstanding.

## Final self-evaluation

The customer UI and Command Center delivery path are implemented; a controlled
production mailbox test remains before treating provider delivery as verified.

| Axis | Score | Evidence / improvement |
|---|---:|---|
| Accuracy | 4/5 | Eight tests pass and core pricing follows the retrieved catalog; the catalog is a snapshot, not live sync. |
| Completeness | 4/5 | All five customer steps and both idempotent Close email deliveries are implemented; the controlled live mailbox test remains. |
| Clarity | 4/5 | Explicit estimate/receipt language and field labels; no formal screen-reader audit completed. |
| Actionability | 5/5 | Local preview, server receiver, durable retry state, and tests are available without Zapier configuration. |
| Conciseness | 4/5 | Popular choices reduce initial menu length; full catalog still needs expansion for less common dishes. |

Overall: 4.4/5. Highest-impact next step: run the user's controlled end-to-end
mailbox test, then verify the live Stripe configuration. Follow-up: automate catalog
synchronization. No production messages were sent during automated verification.
