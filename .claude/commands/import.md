---
description: Bring applications across from an Infonetica (Ethics RM or ERM) applications report saved as CSV. Test run first.
---

# /import

Run:

```bash
node scripts/research-ethics.mjs import infonetica <applications.csv> --dry-run --date-order=DMY
```

Always do the test run first and read the counts back. Then run it without `--dry-run`. See docs/replace-infonetica.md.

Use `--json` when combining results. On an ambiguous name, list the candidates and ask; never pick the first. Nothing here sends a letter or an email: drafts go to `drafts/` and a person sends them.
