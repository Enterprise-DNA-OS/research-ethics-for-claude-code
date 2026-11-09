---
description: Decisions in the last 90 days, the days each took on the clock, and whether the letter went out.
---

# /decisions

Run:

```bash
node scripts/research-ethics.mjs decisions
```

Point out any decision with no letter sent and any that took longer than the target in the profile.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
