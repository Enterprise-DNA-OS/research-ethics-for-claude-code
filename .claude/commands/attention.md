---
description: Everything that needs a person today: submissions to check, late reviews, decisions past target, researchers to chase, letters not sent, conditions, reports, expired approvals, open safety reports, animal numbers, membership gaps and minutes.
---

# /attention

Run:

```bash
node scripts/research-ethics.mjs attention
```

Group by who acts: the ethics office (checks, letters, reminders), the chair (decisions, safety, conflicts), members (late reviews). Lead with safety events and expired approvals. For each, name the command that fixes it.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
