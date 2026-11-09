---
description: Draft the decision letter: approval with dates and reporting duties, conditions, a request for more information, or reasons for not approving.
---

# /draft-decision-letter

Run:

```bash
node scripts/research-ethics.mjs draft-decision-letter <application>
```

Show the file path and the first lines. Never send. Once the operator has sent it, record it with /letter.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
