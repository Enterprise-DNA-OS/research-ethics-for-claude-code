---
description: Mark a submission complete: the decision clock starts today.
---

# /validate

Run:

```bash
node scripts/research-ethics.mjs validate <application>
```

Only do this when every required document is there. If something is missing, log what and tell the operator; the researcher is asked for it before validation.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
