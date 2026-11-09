---
description: Record a progress or final report from the researcher.
---

# /report

Run:

```bash
node scripts/research-ethics.mjs report <application> <progress|final> "<summary>" [--participants=<n>] [--animals=<n used>] [--secure=yes|no]
```

A progress report moves the next report date on. A final report closes the study. Read out any warning about insecure records or animal numbers.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
