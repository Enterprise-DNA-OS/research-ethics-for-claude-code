---
description: The next meetings and what is on each agenda, with reviews still out.
---

# /agenda

Run:

```bash
node scripts/research-ethics.mjs agenda
```

Flag any item with reviews out a week before the meeting, and any meeting whose agenda has closed with space for a late item. Offer /draft-agenda.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
