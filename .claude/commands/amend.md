---
description: Record an amendment to approved research.
---

# /amend

Run:

```bash
node scripts/research-ethics.mjs amend <application> "<what changes>"
```

Report the amendment number and the date to decide by.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
