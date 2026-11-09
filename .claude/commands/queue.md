---
description: Every application not yet decided, with its stage and the days on the decision clock (time with the researcher does not count).
---

# /queue

Run:

```bash
node scripts/research-ethics.mjs queue
```

Lead with anything past the decision target, then submissions not yet checked, then those with no reviewers. Name the command that moves each one on.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
