---
description: Draft a reminder to a member listing every review they have open.
---

# /draft-reviewer-reminder

Run:

```bash
node scripts/research-ethics.mjs draft-reviewer-reminder <member>
```

Show the file path. Never send.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
