---
description: Change fields on a committee, member, application or the office profile.
---

# /set

Run:

```bash
node scripts/research-ethics.mjs set <type> <name> '<json>'
```

Only listed fields are writable; the error names them. For the profile: set office_profile '{"decision_days":60}'.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
