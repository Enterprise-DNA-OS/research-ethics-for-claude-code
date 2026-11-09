---
description: Approvals ending in the next 90 days, and any that have ended with the study still open.
---

# /expiring

Run:

```bash
node scripts/research-ethics.mjs expiring
```

For ended approvals the research has no current approval: ask the investigator for an extension amendment or a final report today. Offer /draft-report-reminder.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
