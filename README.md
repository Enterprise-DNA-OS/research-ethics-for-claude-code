<h1 align="center">Research Ethics for Claude Code</h1>

<p align="center">
  <strong>The open-source research ethics review system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Infonetica data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=infonetica">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/infonetica?utm_source=github&utm_medium=readme&utm_campaign=infonetica">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-infonetica">Instead of Infonetica</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Research Ethics for Claude Code does the job you pay Infonetica for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it can answer questions the Infonetica dashboard cannot.

Infonetica does not publish a price list. Each institution is quoted. UK public contract awards for its ethics system show what that comes to: the University of Birmingham paid GBP 70,725 over three years ([Contracts Finder, 2019](https://www.contractsfinder.service.gov.uk/Notice/b514df4b-47a2-4ebf-b873-d1b12f35e319)) and the University of Sussex GBP 209,472 over four ([Contracts Finder, 2024](https://www.contractsfinder.service.gov.uk/Notice/e05f7ba1-9dad-4ec9-b77a-59288acb788c)), before the staff time spent configuring forms and workflows.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=infonetica).

It covers the work of a research ethics office in Australia or New Zealand that runs a human research ethics committee (HREC), an animal ethics committee (AEC), or both: submissions checked and validated, reviewers assigned with conflicts declared, agendas and meetings with attendance and quorum, decisions and letters, requests for more information with the review clock stopped, conditions of approval, amendments, annual progress and final reports, approvals expiring, serious adverse events and other safety reports, animal numbers against approval, committee membership by category and member terms. It suits universities, hospital and health service HRECs, private HRECs and research institutes.

It checks the rules a committee works under as it goes: annual reporting and monitoring under the National Statement, minimum HREC membership, conflicts of interest, decisions in writing, AEC membership and quorum under the Australian Code, animal use within approved numbers, and in New Zealand the Animal Welfare Act's committee membership and code of ethical conduct.

### Ten questions Infonetica cannot answer for you

Each is one command on your own records today.

1. Which applications are past our decision target once the days with the researcher are taken off? (`/queue`)
2. What is our median turnaround by committee and pathway over the last year, and how much is inside target? (`/turnaround`)
3. Which reviewers are late today, and who is carrying the most reviews this year? (`/reviews`, `/workload`)
4. Which approved studies are past their annual progress report, and which are due in the next 30 days? (`/reports-due`)
5. Which studies are still open on an approval that has already ended? (`/expiring`)
6. Which serious adverse events reached us later than our reporting rule? (`/events`, `/compliance`)
7. Which animal studies have used more animals than approved? (`/animals`)
8. Did any AEC decision happen without a Category A, B, C and D member in the room? (`/compliance`)
9. Which membership categories is each committee missing, and whose terms have ended? (`/membership`, `/members`)
10. Which decisions went out with no letter, and which conditions of approval are still not met? (`/decisions`, `/conditions`)

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/research-ethics-for-claude-code.git
cd research-ethics-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type `/attention`. The demo is a fictional Sydney research institute with an HREC and an AEC: an annual report 40 days late, an approval that ended with the study still open, a reviewer a week late, an application past the decision target, a serious adverse event reported eight days after it happened, a reviewer who declared a conflict and reviewed anyway, a rat study 12 animals over its approval, an AEC decision made with no independent member present and an HREC missing its pastoral care member.

### Your first hour: ten things to ask for

1. "Our decision target is 45 days and safety reports are due within 2 days." (`/customise`, `/set`)
2. "Import our Infonetica applications report, test run first." (`/import`)
3. "What needs doing today?" (`/attention`)
4. "Where is every application up to?" (`/queue`)
5. "Assign Prof Okafor and Margaret Ellis to the new vaping study." (`/assign`)
6. "Draft the agenda for the next HREC meeting." (`/draft-agenda`)
7. "The committee approved HREC-2026-040 with a condition: a one-page information sheet." (`/decide`)
8. "Draft the decision letter." (`/draft-decision-letter`)
9. "Who owes us an annual report? Draft the reminders." (`/reports-due`, `/draft-report-reminder`)
10. "Give me the Monday review." (`/weekly-review`)

`npm run view` renders read-only pages (the week, monitoring, committees) and `npm run docs` renders approval certificates, meeting agendas and each committee's annual report in your brand from `brand.json`.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| `/attention` | Everything that needs a person today: submissions to check, late reviews, decisions past target, researchers to chase, letters not sent, conditions, reports, expired approvals, open safety reports, animal numbers, membership gaps and minutes. |
| `/queue` | Every application not yet decided, with its stage and the days on the decision clock (time with the researcher does not count). |
| `/validate` | Mark a submission complete: the decision clock starts today. |
| `/assign` | Assign a committee member to review an application. |
| `/conflict` | Record a member's declared interest in an application. They do not review it and leave the room when it is discussed. |
| `/review` | Record a reviewer's recommendation and comments. |
| `/reviews` | Reviews assigned and not yet returned, oldest due first, with days late. |
| `/draft-reviewer-reminder` | Draft a reminder to a member listing every review they have open. |
| `/agenda` | The next meetings and what is on each agenda, with reviews still out. |
| `/add-meeting` | Add a committee meeting. |
| `/schedule` | Put an application on a meeting's agenda. |
| `/draft-agenda` | Draft a meeting's agenda pack: apologies and quorum, declarations of interest, minutes, new applications, amendments and open safety reports. |
| `/attend` | Record who was at a meeting. |
| `/held` | Mark a meeting held and check its quorum. |
| `/minutes` | Record that a meeting's minutes were confirmed. |
| `/decide` | Record the committee's decision on an application. |
| `/draft-decision-letter` | Draft the decision letter: approval with dates and reporting duties, conditions, a request for more information, or reasons for not approving. |
| `/letter` | Record that the decision letter was sent. |
| `/resubmit` | The researcher has responded to a request for more information: restart the clock and send it back to the same reviewers. |
| `/conditions` | Approvals given with conditions that the researcher has not yet met. |
| `/conditions-met` | Record that the conditions of approval have been met. |
| `/decisions` | Decisions in the last 90 days, the days each took on the clock, and whether the letter went out. |
| `/approvals` | All approved research that is running: approval dates, expiry and the next progress report. |
| `/reports-due` | Annual progress reports late or due within the reminder window. |
| `/draft-report-reminder` | Draft a reminder for a progress report, or a final report when the approval has ended. |
| `/report` | Record a progress or final report from the researcher. |
| `/final-reports` | Studies whose approval has ended and no final report has arrived. |
| `/expiring` | Approvals ending in the next 90 days, and any that have ended with the study still open. |
| `/amend` | Record an amendment to approved research. |
| `/amendments` | Amendments to approved research, waiting and decided, with days open. |
| `/decide-amendment` | Decide an amendment. |
| `/event` | Record a safety or conduct report: a serious adverse event, protocol deviation, complaint, breach or unexpected death. |
| `/events` | Safety and conduct reports: serious adverse events, deviations, complaints, breaches and unexpected deaths, with how fast each was reported. |
| `/close-event` | Close a safety or conduct report with the action taken. |
| `/animals` | Animal approvals: numbers approved, numbers used from the reports, and what remains. |
| `/suspend` | Suspend approved research. |
| `/withdraw` | Withdraw an application not yet decided. |
| `/submit` | Register a new ethics application. |
| `/application` | Everything about one application: details, reviews, amendments, reports, safety events and notes. |
| `/applications` | Every application, newest first. |
| `/member` | One member's record, reviews and meeting attendance. |
| `/members` | Every member with committee, category, term end, confidentiality undertaking and reviews open. |
| `/membership` | Each committee's members counted by membership category. |
| `/meeting` | One meeting: attendance by category, whether it had a quorum, and its agenda. |
| `/meetings` | Meetings, held and coming, with attendance by category, minutes and items. |
| `/committees` | Each committee with its registration, quorum, active members and work in progress. |
| `/turnaround` | Turnaround for the last 12 months by committee and pathway: median and slowest days on the clock, and the share inside the target. |
| `/workload` | Reviews per member over the last 12 months: assigned, open, returned late and average days to return. |
| `/outcomes` | Decisions in the last 12 months by committee and outcome. |
| `/log` | Add a note to an application's history. |
| `/activity` | The notes logged against applications, newest first. |
| `/add` | Add a committee or member. |
| `/set` | Change fields on a committee, member, application or the office profile. |
| `/profile` | The office profile: jurisdiction, time zone and every target and period the commands enforce. |
| `/import` | Bring applications across from an Infonetica (Ethics RM or ERM) applications report saved as CSV. Test run first. |
| `/export` | Export every record to one JSON file. |
| `/audit` | The audit trail: every change made through the commands, with its arguments and any override reason. |
| `/weekly-review` | The Monday review for the ethics manager and chair: the queue, the next meetings, late reviews, decisions, reports due, approvals expiring, open safety reports and turnaround. |
| `/compliance` | Check every record against the rules an ethics committee runs under (National Statement, Australian Code, NZ Animal Welfare Act and your own terms), with the rule and its source for each breach. |
| `/customise` | Make this system yours in plain language. Add a field, rename stages, change a rule, add a column to a document. Writes the migration, applies it, updates the commands that touch it. |
| `/new-view` | Add a read-only HTML view (a dashboard page) from a plain-language description, rendered in the operator's brand by `npm run view`. |

## Instead of Infonetica

Run an applications report in Infonetica (Ethics RM or ERM), save it as CSV, and run `node scripts/research-ethics.mjs import infonetica applications.csv --dry-run --date-order=DMY`. It brings references, titles, investigators, committees, pathways, status, submission, decision, approval and expiry dates, and animal species and numbers. A second run updates rather than duplicates. The application forms and attachments themselves, reviewer comments and correspondence stay in the documents Infonetica gives you at the end of the contract: [docs/replace-infonetica.md](docs/replace-infonetica.md) says what maps and what does not.

## Architecture

```
research-ethics-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive (research-ethics.mjs)
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Research Ethics for Claude Code for your business, migrates your Infonetica data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=infonetica)
- Read more: [enterprisedna.co/omni/instead-of/infonetica](https://enterprisedna.co/omni/instead-of/infonetica?utm_source=github&utm_medium=readme&utm_campaign=infonetica)

## License

MIT. Copyright (c) 2026 Enterprise DNA.
