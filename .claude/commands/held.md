---
description: Mark a meeting held and check its quorum.
---

# /held

Run:

```bash
node scripts/research-ethics.mjs held <meeting>
```

If there was no quorum, say which category was missing. Decisions at that meeting will be refused.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
