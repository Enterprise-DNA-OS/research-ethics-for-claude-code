# Research Ethics for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| everything that needs a person today: submissions to check, late reviews, decisions past target, researchers to chase, letters not sent, conditions, reports, expired approvals, open safety reports, animal numbers, membership gaps and minutes. | `/attention` |
| every application not yet decided, with its stage and the days on the decision clock (time with the researcher does not count). | `/queue` |
| mark a submission complete: the decision clock starts today. | `/validate` |
| assign a committee member to review an application. | `/assign` |
| record a member's declared interest in an application. They do not review it and leave the room when it is discussed. | `/conflict` |
| record a reviewer's recommendation and comments. | `/review` |
| reviews assigned and not yet returned, oldest due first, with days late. | `/reviews` |
| draft a reminder to a member listing every review they have open. | `/draft-reviewer-reminder` |
| the next meetings and what is on each agenda, with reviews still out. | `/agenda` |
| add a committee meeting. | `/add-meeting` |
| put an application on a meeting's agenda. | `/schedule` |
| draft a meeting's agenda pack: apologies and quorum, declarations of interest, minutes, new applications, amendments and open safety reports. | `/draft-agenda` |
| record who was at a meeting. | `/attend` |
| mark a meeting held and check its quorum. | `/held` |
| record that a meeting's minutes were confirmed. | `/minutes` |
| record the committee's decision on an application. | `/decide` |
| draft the decision letter: approval with dates and reporting duties, conditions, a request for more information, or reasons for not approving. | `/draft-decision-letter` |
| record that the decision letter was sent. | `/letter` |
| the researcher has responded to a request for more information: restart the clock and send it back to the same reviewers. | `/resubmit` |
| approvals given with conditions that the researcher has not yet met. | `/conditions` |
| record that the conditions of approval have been met. | `/conditions-met` |
| decisions in the last 90 days, the days each took on the clock, and whether the letter went out. | `/decisions` |
| all approved research that is running: approval dates, expiry and the next progress report. | `/approvals` |
| annual progress reports late or due within the reminder window. | `/reports-due` |
| draft a reminder for a progress report, or a final report when the approval has ended. | `/draft-report-reminder` |
| record a progress or final report from the researcher. | `/report` |
| studies whose approval has ended and no final report has arrived. | `/final-reports` |
| approvals ending in the next 90 days, and any that have ended with the study still open. | `/expiring` |
| record an amendment to approved research. | `/amend` |
| amendments to approved research, waiting and decided, with days open. | `/amendments` |
| decide an amendment. | `/decide-amendment` |
| record a safety or conduct report: a serious adverse event, protocol deviation, complaint, breach or unexpected death. | `/event` |
| safety and conduct reports: serious adverse events, deviations, complaints, breaches and unexpected deaths, with how fast each was reported. | `/events` |
| close a safety or conduct report with the action taken. | `/close-event` |
| animal approvals: numbers approved, numbers used from the reports, and what remains. | `/animals` |
| suspend approved research. | `/suspend` |
| withdraw an application not yet decided. | `/withdraw` |
| register a new ethics application. | `/submit` |
| everything about one application: details, reviews, amendments, reports, safety events and notes. | `/application` |
| every application, newest first. | `/applications` |
| one member's record, reviews and meeting attendance. | `/member` |
| every member with committee, category, term end, confidentiality undertaking and reviews open. | `/members` |
| each committee's members counted by membership category. | `/membership` |
| one meeting: attendance by category, whether it had a quorum, and its agenda. | `/meeting` |
| meetings, held and coming, with attendance by category, minutes and items. | `/meetings` |
| each committee with its registration, quorum, active members and work in progress. | `/committees` |
| turnaround for the last 12 months by committee and pathway: median and slowest days on the clock, and the share inside the target. | `/turnaround` |
| reviews per member over the last 12 months: assigned, open, returned late and average days to return. | `/workload` |
| decisions in the last 12 months by committee and outcome. | `/outcomes` |
| add a note to an application's history. | `/log` |
| the notes logged against applications, newest first. | `/activity` |
| add a committee or member. | `/add` |
| change fields on a committee, member, application or the office profile. | `/set` |
| the office profile: jurisdiction, time zone and every target and period the commands enforce. | `/profile` |
| bring applications across from an Infonetica (Ethics RM or ERM) applications report saved as CSV. Test run first. | `/import` |
| export every record to one JSON file. | `/export` |
| the audit trail: every change made through the commands, with its arguments and any override reason. | `/audit` |
| the Monday review for the ethics manager and chair: the queue, the next meetings, late reviews, decisions, reports due, approvals expiring, open safety reports and turnaround. | `/weekly-review` |
| check every record against the rules an ethics committee runs under (National Statement, Australian Code, NZ Animal Welfare Act and your own terms), with the rule and its source for each breach. | `/compliance` |
| make this system yours in plain language. Add a field, rename stages, change a rule, add a column to a document. Writes the migration, applies it, updates the commands that touch it. | `/customise` |
| add a read-only HTML view (a dashboard page) from a plain-language description, rendered in the operator's brand by `npm run view`. | `/new-view` |

If an ask fits nothing here, run the CLI directly (`node scripts/research-ethics.mjs help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or withdrawn.
- Applications hold research and personal details. Keep exports and drafts inside this folder or the operator's own storage.
- The committee decides. Never record a decision, a conflict or a member's review the operator has not told you about.
- An override (`--override="<reason>"`) is only for a reason the chair or the operator gave this session, written down word for word.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off Infonetica.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/infonetica
