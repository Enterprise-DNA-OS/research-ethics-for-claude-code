---
description: Add a committee meeting.
---

# /add-meeting

Run:

```bash
node scripts/research-ethics.mjs add-meeting <committee> <YYYY-MM-DD> [--closes=YYYY-MM-DD]
```

The agenda closes 14 days before unless set.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
