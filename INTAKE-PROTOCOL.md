# 🤖 AI Consulting — Automated Intake Protocol

## Trigger
When a new email arrives at rawandre@gmail.com from `submissions@formsubmit.co` with subject containing "AI Audit Request"

## Automated Steps (Rawbot executes immediately)

### Step 1: Extract & Parse
- Read email HTML, extract all form fields
- Create client file: `ai-consulting/clients/{business-name}/intake.md`

### Step 2: Industry Research
- Web search: "{business name} {city}" + "{industry} AI trends"
- Competitor analysis: what AI tools exist for their niche
- Benchmark data: industry avg conversion rates, response times

### Step 3: Pain Point Analysis
- Score each pain point (from form ratings)
- Identify TOP 3 revenue-impacting issues
- Calculate estimated monthly loss per issue

### Step 4: AI Solution Mapping
- Map each pain point → specific AI tool + implementation
- Estimate cost per solution
- Calculate ROI (must show 3x-5x minimum)

### Step 5: Strategy Deck Draft
- Build 3-tier proposal (Starter / Growth / Empire)
- Include ROI calculations
- Personalize with their actual numbers

### Step 6: Alert André
- Send full analysis to Telegram
- Include recommended call talking points (NEPQ)
- Suggest best time to reach out

## Gmail Check Schedule
- Cron job checks rawandre@gmail.com every 2 hours for new FormSubmit emails
- On detection → auto-trigger full pipeline above

## Credentials
- Email: rawandre@gmail.com
- App Password: stored in env
- IMAP: imap.gmail.com SSL
