---
description: Every member with committee, category, term end, confidentiality undertaking and reviews open.
---

# /members

Run:

```bash
node scripts/research-ethics.mjs members
```

Flag terms ended or ending in 90 days and any member with no confidentiality undertaking on file.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
