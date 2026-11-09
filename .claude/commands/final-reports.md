---
description: Studies whose approval has ended and no final report has arrived.
---

# /final-reports

Run:

```bash
node scripts/research-ethics.mjs final-reports
```

Offer /draft-report-reminder (it asks for the final report when the approval has ended).

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
