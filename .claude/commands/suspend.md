---
description: Suspend approved research.
---

# /suspend

Run:

```bash
node scripts/research-ethics.mjs suspend <application> "<reason>"
```

Only on the chair's or committee's decision. Then draft the letter to the investigator by hand from the reason.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
