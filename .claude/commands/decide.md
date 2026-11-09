---
description: Record the committee's decision on an application.
---

# /decide

Run:

```bash
node scripts/research-ethics.mjs decide <application> <approved|approved with conditions|revisions|declined> "<conditions or the changes asked for>" [--due=YYYY-MM-DD] [--override="<reason>"]
```

Refused while reviews are out, before a full-review meeting is held, at a meeting without quorum, or where a conflicted member reviewed. Approval sets the expiry and the first progress report date. Then offer /draft-decision-letter.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
