---
description: Reviews assigned and not yet returned, oldest due first, with days late.
---

# /reviews

Run:

```bash
node scripts/research-ethics.mjs reviews
```

Group by reviewer. For anyone late, offer /draft-reviewer-reminder, or a reassignment with /assign.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
