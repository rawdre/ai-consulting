# Raw AI Site — Canonical Publish Folder

This folder is the **official working source** for the public Raw AI site:
- https://rawdre.github.io/ai-consulting/

## Rule
If a page is meant to go live on the Raw AI site, edit it here first.

## What belongs here
- `index.html`
- public pitch pages
- client-facing landing pages meant for GitHub Pages
- shared web assets required by the live site

## Christalight rule
- Draft/source work can live in `../christalight-menus/`
- Final public pages must be copied here before publish

## Publish note
GitHub Pages behavior can get messy if branches are mixed.
Use the publish helper/checklist from the workspace root/scripts when possible.

## Mission Control refresh
- `mission-control.html` reads from `mission-control-data/latest.json`
- `refresh-mission-control.mjs` rebuilds that file from the Close guardrail runner
- `.github/workflows/mission-control-refresh.yml` runs the refresh on a schedule and on manual dispatch

### GitHub setup required
- Add repository secret `CLOSE_API_KEY`
- Optional: add repository secret `CLOSE_OWNER_ID`
- Optional: add repository variable `CLOSE_API_BASE_URL` if Close base URL ever changes

## Signature
Organized by **Rawbot 🔥** for André Raw.
