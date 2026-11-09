---
description: One meeting: attendance by category, whether it had a quorum, and its agenda.
---

# /meeting

Run:

```bash
node scripts/research-ethics.mjs meeting <name>
```

If the quorum check fails, say which category was missing; decisions at that meeting are refused.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
