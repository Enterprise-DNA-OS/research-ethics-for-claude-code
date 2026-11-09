---
description: One member's record, reviews and meeting attendance.
---

# /member

Run:

```bash
node scripts/research-ethics.mjs member <name>
```

Summarise their open reviews and attendance over the last year.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
