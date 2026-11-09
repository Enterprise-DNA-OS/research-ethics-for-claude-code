---
description: Register a new ethics application.
---

# /submit

Run:

```bash
node scripts/research-ethics.mjs submit "<title>" <committee> "<investigator>" --email=<email> --department=<department> [--pathway=full|low risk|exempt] [--species=<species> --animals=<number>] [--student]
```

An animal application needs the species and the number of animals asked for. Report the reference and the date it must be checked by.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
