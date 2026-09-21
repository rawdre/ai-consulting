# Customer catering menu builder

Local branch: `feature/customer-catering-builder`. The existing tray menu links to
`comeketo/menus/catering-package.html`. Existing tray purchasing behavior is retained.

## Customer experience

Event and service style → dishes → full venue address → contact and callback
permission → editable review → request receipt. No payment or binding booking.
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

## Release blocker: verify BOTH email deliveries

The existing public tray page uses a Zapier Catch Hook. This builder submits to
that same hook and preserves `email`, `customer_name`, `phone`, `items`,
`order_summary_text`, `customer_quote_html`, `event_total`, and related fields.
No production request was sent during testing. Access to the Zapier workflow
was not available, so email delivery has not been verified or changed.

Before deployment, inspect the existing Zap and configure/verify this branch:

1. Filter `source` = `Customer Catering Package Builder` so existing tray-only
   template assumptions do not break the new payload.
2. Deduplicate accepted requests by `request_id` in persistent storage. The client
   preserves this ID for unchanged retries; client-only IDs do not deduplicate.
3. Customer delivery: To = `email`; subject = `Your Comeketo menu request`;
   HTML body = `customer_quote_html`. Use a verified Comeketo sender and Reply-To
   `team@comeketocatering.com`.
4. Team delivery: To = `team@comeketocatering.com` (current site contact; confirm
   this is Andre’s desired callback inbox); subject = `subject`; body =
   `team_notification_html`; Reply-To = customer `email`. The body includes phone,
   callback window, menu, complete address, notes, and itemized estimate.
5. Ensure a failure in one delivery does not silently prevent the other; configure
   retry/error alerts and inspect email-provider delivery logs for both messages.
6. Run one authorized test using a controlled recipient. Verify the two messages,
   all fields, and failure recovery before public release.

Webhook success confirms intake ONLY, not either email delivery. The receipt
screen therefore never claims an email was delivered. The customer can download
the submitted summary. Errors retain the form and do not show false success.

Do not add private email-provider or Close API keys to these public files.
The public form is not a trusted source of final prices. Review estimates against
the command center before issuing a final quote. A future dedicated backend can
recalculate pricing and enforce rate limiting and request deduplication.

## Validation / evidence

Journeys derived from the user’s request in this task.

- RED: initial four tests failed because PackageCore did not exist (529c63a).
- RED: receipt test failed because `submit` did not exist (1aa09c6).
- GREEN: `node --test --experimental-test-coverage comeketo/menus/package-builder.test.cjs`
  passes all eight tests. Core coverage: 100% lines/functions, 92% branches.
- Covers catalog tiers across four styles, extras, drop-off minimums, invalid
  selections, date/address/contact requirements, consent, HTML escaping, and
  explicit webhook receipt with network/JSON/error failures mocked locally.
- Browser walkthrough on local preview: required-field block, empty-menu block,
  two mains + a side, address, contact, consent, review, and return-to-edit with
  preserved state. No live submissions.
- Desktop and 390px mobile visual inspection. No prior visual baseline exists;
  visual regression comparison is inconclusive. No formal screen-reader audit.
- No dependencies were added; this static feature has no package manifest and
  no applicable npm dependency audit. No changes made to command-center backend.

Not published. The email workflow verification above is required before release.

## Final self-evaluation

The customer UI is reviewable locally; production email delivery remains unverified.

| Axis | Score | Evidence / improvement |
|---|---:|---|
| Accuracy | 4/5 | Eight tests pass and core pricing follows the retrieved catalog; the catalog is a snapshot, not live sync. |
| Completeness | 3/5 | All five customer steps are implemented; both production email deliveries still need Zapier access and verification. |
| Clarity | 4/5 | Explicit estimate/receipt language and field labels; no formal screen-reader audit completed. |
| Actionability | 4/5 | Local preview and email field mappings are available; external automation configuration is still required. |
| Conciseness | 4/5 | Popular choices reduce initial menu length; full catalog still needs expansion for less common dishes. |

Overall: 3.8/5. Highest-impact next step: configure and verify both email deliveries,
then obtain publishing approval. Follow-up: automate catalog synchronization.
Would the user agree? The preview is ready to assess, but calling the integration
fully live would overstate completion. No production messages, pushes, or deploys
were performed.
