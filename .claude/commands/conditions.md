---
description: Approvals given with conditions that the researcher has not yet met.
---

# /conditions

Run:

```bash
node scripts/research-ethics.mjs conditions
```

Show what is outstanding and how late. When the researcher sends what was asked for, record it with /conditions-met.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
