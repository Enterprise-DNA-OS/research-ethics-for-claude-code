---
description: Assign a committee member to review an application.
---

# /assign

Run:

```bash
node scripts/research-ethics.mjs assign <application> <member> [--due=YYYY-MM-DD]
```

Refused for the investigator themselves or a member of another committee. Read out any warning (term ended, no confidentiality undertaking). Check /workload to spread the load.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
