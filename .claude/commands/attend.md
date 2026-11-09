---
description: Record who was at a meeting.
---

# /attend

Run:

```bash
node scripts/research-ethics.mjs attend <meeting> <member> [--absent]
```

Record everyone before marking the meeting held, so the quorum check is right.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
