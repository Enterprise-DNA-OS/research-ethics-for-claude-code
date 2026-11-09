---
description: Draft a meeting's agenda pack: apologies and quorum, declarations of interest, minutes, new applications, amendments and open safety reports.
---

# /draft-agenda

Run:

```bash
node scripts/research-ethics.mjs draft-agenda <meeting>
```

Show the file. Offer `npm run docs -- meeting-agenda` for the branded version.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
