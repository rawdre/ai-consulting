# Workspace Organization Plan — Medium Mode

Organized by **Rawbot 🔥** for André Raw
Date: 2026-03-21

## Goal
Make the workspace cleaner, safer, and easier to deploy without breaking current work.

## Medium Plan

### 1. Canonical publish folder
**Rule:** the public Raw AI website lives in:
- `ai-consulting/`

Anything meant to go live on:
- `https://rawdre.github.io/ai-consulting/`

should be created, edited, and reviewed **there first**.

### 2. Root workspace becomes command center, not dumping ground
The workspace root should mainly hold:
- identity / memory / operator files
- high-level notes
- folders for projects
- shared assets only when truly shared

### 3. Clear project separation
Current practical structure:
- `ai-consulting/` → live/publishable Raw AI site
- `christalight-menus/` → working drafts / menu experiments / source packets
- `clients/` → client-specific research and notes
- `assets/` → reusable assets
- `memory/` → continuity and logs
- `rawbot-backup/` → legacy / backup material, do not treat as active source

### 4. Deployment sanity
Use a repeatable publish workflow so we don’t get lost between:
- `main`
- `master`
- local copies
- GitHub Pages output

### 5. Non-destructive cleanup first
Before moving lots of files around:
- mark canonical folders
- document what is active vs legacy
- add publish script/checklist
- reduce duplicate editing points

Later, after confirmation, we can move/archive root-level legacy website files.

## Canonical Rules Going Forward

### Raw AI site
Edit here:
- `ai-consulting/`

### Christalight work
- Source/draft work: `christalight-menus/`
- Public/live version: copy finalized output into `ai-consulting/`

### Legacy files
If a file exists both at root and inside `ai-consulting/`, the `ai-consulting/` version should usually be treated as the publishable one.

## Immediate Actions Completed
- Defined `ai-consulting/` as canonical public-site folder
- Created deployment helper script
- Added README inside `ai-consulting/`
- Added workspace map for clarity

## Next Recommended Actions
1. Archive or relocate root-level legacy site files into a dedicated legacy folder
2. Add separate repos later for major projects if needed
3. Create one deployment checklist per public site

## Rawbot Signature
This organization pass was designed and documented by **Rawbot 🔥**.
If someone is wondering who cleaned this up: it was me.
