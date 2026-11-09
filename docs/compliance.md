# The rules this system checks

`/compliance` checks the records against every rule below and names the source. Each rule is either a rule the committee works under (with its source) or a rule your office set for itself (marked **your rule**, with the setting that controls it in `office_profile`). Change a setting with `/set office_profile`. Change a rule by asking `/customise`.

Nothing here is legal advice. It records the rules your office has told the system to enforce. When a new edition of the National Statement, the Australian Code or a New Zealand standard comes out, read the change, then update this file and the check together.

## Sources

- **National Statement**: National Statement on Ethical Conduct in Human Research 2025, NHMRC, ARC and Universities Australia. Effective from 23 June 2026, replacing the 2023 edition. Section 5 covers institutional responsibilities, HREC membership, conflicts of interest and the monitoring of approved research. https://www.nhmrc.gov.au/about-us/publications/national-statement-ethical-conduct-human-research-2025
- **Australian Code**: Australian code for the care and use of animals for scientific purposes, 8th edition 2013, updated 2021, NHMRC. Section 2.2 sets AEC membership (Categories A to D) and quorum. https://www.nhmrc.gov.au/about-us/publications/australian-code-care-and-use-animals-scientific-purposes
- **Animal Welfare Act 1999 (NZ)**: Part 6 (research, testing and teaching) requires animal use under a code of ethical conduct approved by the Director-General, and sets who sits on an animal ethics committee (section 100). https://www.legislation.govt.nz/act/public/1999/0142/latest/whole.html
- **National Ethical Standards (NZ)**: National Ethical Standards for Health and Disability Research and Quality Improvement, National Ethics Advisory Committee. https://neac.health.govt.nz/national-ethical-standards/

## Human research

| Rule | What it checks | Source |
|---|---|---|
| ANNUAL-REPORT | Every running approval has a progress report at least once a year: progress, or the outcome, and how records are kept secure. The report date moves on a year (`report_interval_months`) each time one arrives. | National Statement, Section 5 (monitoring); NZ: National Ethical Standards |
| FINAL-REPORT | A final report within `final_report_days` (90) of the approval ending. | National Statement, Section 5; the days are **your rule** |
| APPROVAL-CURRENT | No study stays open on an approval that has ended. It is extended by amendment or closed with a final report. | National Statement, Section 5 |
| CONFLICT-OF-INTEREST | A member who declares an interest in an application takes no part in reviewing or deciding it. `/review` and `/decide` refuse while it stands. | National Statement, Section 5 |
| DECISION-IN-WRITING | The decision, with any conditions or reasons, goes to the researcher in writing within `letter_days` (5). | National Statement, Section 5; the days are **your rule** |
| HREC-MEMBERSHIP | At least eight members: a chair; at least two lay people; at least one person with knowledge of and current experience in the professional care, counselling or treatment of people; at least one person who performs a pastoral care role in a community; at least one lawyer; at least two people with current research experience. Categories in `members.category`: chair, lay, care, pastoral, lawyer, researcher. | National Statement, Section 5 (paragraph 5.1.30 in the 2023 edition) |
| CONDITIONS-MET | Conditions of approval are met by the date set (`--due`, default 30 days). | **your rule** |
| SAFETY-REPORTING | A serious adverse event or unexpected death reaches the committee within `safety_report_days` (3) of happening. Set it to the timelines your sponsors, the TGA or Medsafe and your own terms require. | **your rule** |
| MINUTES | Every meeting is minuted and the minutes confirmed within `minutes_confirm_days` (45). | National Statement, Section 5 (records of meetings); the days are **your rule** |
| CONFIDENTIALITY | Every member has a signed confidentiality undertaking on file. | **your rule** (terms of reference) |
| QUORUM | A committee decides only with at least `committees.quorum` members present. | **your rule** (terms of reference) |

## Animal research

| Rule | What it checks | Source |
|---|---|---|
| AEC-MEMBERSHIP | A chair and at least one member in each category: A (veterinarian), B (researcher using animals), C (animal welfare), D (independent, never used animals, not employed by the institution). C and D together at least a third of the members. | Australian Code, 2.2.4 |
| AEC-QUORUM | A decision is made only with at least one member from each of Categories A, B, C and D present, and quorum kept when a conflicted member steps out. `/decide` refuses otherwise. | Australian Code, 2.2.25 and 2.3.12 |
| ANIMAL-NUMBERS | Animals used, from the progress and final reports, never exceed the number approved without an approved amendment first. | Australian Code; NZ: the code of ethical conduct |
| AEC-MEMBERSHIP-NZ | (NZ) At least four members, including a veterinarian nominated by the New Zealand Veterinary Association, a nominee of an approved animal welfare organisation, and a lay member nominated by a territorial authority or regional council. Categories: senior, vet, welfare, lay, chair. | Animal Welfare Act 1999, section 100 |
| NZ-CODE-OF-CONDUCT | (NZ) Animal research runs only under a code of ethical conduct approved by the Director-General. Record the approval's end date in `code_approved_until`. | Animal Welfare Act 1999, Part 6 |

## Targets the office works to (attention, not compliance)

These are your own service levels. `/attention` and `/queue` use them; they are not breaches.

| Setting | Default | What it drives |
|---|---|---|
| `validate_days` | 5 | A new submission checked complete or returned |
| `review_days` | 14 | Reviewer due date on `/assign` |
| `decision_days` | 60 | Days on the clock, valid submission to decision, with days spent with the researcher taken off |
| `revisions_chase_days` | 21 | Chase a researcher who has not answered a request for more information |
| `amendment_days` | 30 | Decide an amendment |
| `report_reminder_days` | 30 | Start reminding before a progress report is due |
| `approval_years` | 5 | Length of a new approval |
