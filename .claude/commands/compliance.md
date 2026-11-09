---
description: Check every record against the rules an ethics committee runs under (National Statement, Australian Code, NZ Animal Welfare Act and your own terms), with the rule and its source for each breach.
---

# /compliance

Run:

```bash
node scripts/research-ethics.mjs compliance --json
```

1. Each row is one breach: the rule, the record, what is wrong, the requirement and its source. The rules and where each comes from are in `docs/compliance.md`.
2. Report as a table grouped by rule: count, the worst example, the source. Order: research running without a current approval, safety reporting and animal numbers first; then conflicts, quorum and membership; then reports, letters, conditions, minutes and undertakings.
3. For each, name the fix: the command to run, the reminder to draft (to `drafts/`, never sent), or the committee decision needed.
4. If a rule in `docs/compliance.md` looks out of date (a new edition of the National Statement or the Code), say so and stop. The operator confirms the rule, then you update the doc and the check together.

Nothing here is legal advice. The doc records the rules the office has told the system to enforce, with sources, and this command checks the data against them.
