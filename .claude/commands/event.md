---
description: Record a safety or conduct report: a serious adverse event, protocol deviation, complaint, breach or unexpected death.
---

# /event

Run:

```bash
node scripts/research-ethics.mjs event <application> <serious adverse event|protocol deviation|complaint|breach|unexpected death> <occurred YYYY-MM-DD> "<what happened>"
```

Serious events go to the chair the same day. If it was reported late against the profile's rule, say so.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
