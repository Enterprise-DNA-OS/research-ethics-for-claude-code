---
description: Record that the decision letter was sent.
---

# /letter

Run:

```bash
node scripts/research-ethics.mjs letter <application>
```

Run only after the operator confirms it went.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
