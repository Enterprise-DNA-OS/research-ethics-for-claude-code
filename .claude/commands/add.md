---
description: Add a committee or member.
---

# /add

Run:

```bash
node scripts/research-ethics.mjs add <committees|members> '<json>'
```

Members need a committee and a category (chair, lay, care, pastoral, lawyer, researcher for human committees; A, B, C, D or chair for an Australian AEC; senior, vet, welfare, lay or chair in New Zealand).

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
