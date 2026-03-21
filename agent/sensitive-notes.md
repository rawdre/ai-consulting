# Sensitive notes

Do not casually copy secrets from operational files into memory, chat, or tracked notes.

Current sensitivity concerns observed during initial scan:
- `check-inbox.py` appears to contain direct email login credentials in code and should be treated as sensitive.
- `INTAKE-PROTOCOL.md` references credentials stored in env; verify the live setup before editing automation.
- Proposal and client-specific pages may contain business-sensitive strategy, pricing, or prospect-specific details.

Recommended handling:
- Move hardcoded credentials to environment variables or ignored secret files.
- Avoid quoting secrets back into chat.
- Keep agent notes focused on structure, workflows, and decisions — not raw credentials.
