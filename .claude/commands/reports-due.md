---
description: Annual progress reports late or due within the reminder window.
---

# /reports-due

Run:

```bash
node scripts/research-ethics.mjs reports-due
```

Offer /draft-report-reminder for each. Record a report when it arrives with /report.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
