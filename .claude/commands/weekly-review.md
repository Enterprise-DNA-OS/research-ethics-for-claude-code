---
description: The Monday review for the ethics manager and chair: the queue, the next meetings, late reviews, decisions, reports due, approvals expiring, open safety reports and turnaround.
---

# /weekly-review

Run:

```bash
node scripts/research-ethics.mjs weekly-review --json
node scripts/research-ethics.mjs attention --json
node scripts/research-ethics.mjs compliance --json
```

Write it in five short sections: the queue (what is late and why), the next meeting (agenda and reviews out), monitoring (reports, expiries, safety), compliance (any breach, with the rule), and three named actions for this week with who does each. Numbers in tables. Nothing is sent.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
