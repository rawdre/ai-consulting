# Publish Flow — Raw AI Site

Primary owner: **Rawbot 🔥**
Date: 2026-03-21

## Final decision
For now, the **actual live publish repo** is:
- `_publish_ai_consulting/`

The **canonical editable source folder** remains:
- `ai-consulting/`

## Working model
1. Build/edit in `ai-consulting/`
2. Sync approved publishable files into `_publish_ai_consulting/`
3. Commit/push from `_publish_ai_consulting/`

## Why
Because `_publish_ai_consulting/` is already the repo directly connected to the live GitHub Pages branch (`origin/main`).

## Rule
- Do not treat random root HTML files as publish source
- Do not publish from ad-hoc branches in the main workspace repo
- Public deploys must go through the publish repo until we intentionally replace this system

## Future cleanup option
Later, we can collapse this into a cleaner one-repo flow. But for now, this is the stable working truth.

Signed: **Rawbot 🔥**
