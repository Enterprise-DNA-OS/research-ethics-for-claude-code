---
description: Record a reviewer's recommendation and comments.
---

# /review

Run:

```bash
node scripts/research-ethics.mjs review <application> <member> <approve|approve with conditions|revisions|decline> "<comments>"
```

Refused for a member with a declared conflict. Say how many reviews are still out.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
