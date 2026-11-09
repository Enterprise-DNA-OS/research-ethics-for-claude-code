---
description: Put an application on a meeting's agenda.
---

# /schedule

Run:

```bash
node scripts/research-ethics.mjs schedule <application> <meeting> [--override="<reason>"]
```

Refused after the agenda has closed unless the chair agreed a late item; record the reason in the override.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
