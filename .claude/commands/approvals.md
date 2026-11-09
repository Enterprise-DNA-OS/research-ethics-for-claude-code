---
description: All approved research that is running: approval dates, expiry and the next progress report.
---

# /approvals

Run:

```bash
node scripts/research-ethics.mjs approvals
```

Sort as shown. Point out anything expiring within 90 days or already past expiry.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
