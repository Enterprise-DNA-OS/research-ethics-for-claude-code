---
description: Record a member's declared interest in an application. They do not review it and leave the room when it is discussed.
---

# /conflict

Run:

```bash
node scripts/research-ethics.mjs conflict <application> <member> "<the interest>"
```

If they had already returned a review, it stops counting: assign another reviewer.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
