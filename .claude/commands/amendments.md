---
description: Amendments to approved research, waiting and decided, with days open.
---

# /amendments

Run:

```bash
node scripts/research-ethics.mjs amendments
```

Anything waiting longer than the amendment target in the profile goes first. Decide with /decide-amendment.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
