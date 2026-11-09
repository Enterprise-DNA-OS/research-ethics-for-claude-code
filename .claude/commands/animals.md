---
description: Animal approvals: numbers approved, numbers used from the reports, and what remains.
---

# /animals

Run:

```bash
node scripts/research-ethics.mjs animals
```

Anything below zero is use beyond approval: it goes to the committee and needs an amendment before more animals are used.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
