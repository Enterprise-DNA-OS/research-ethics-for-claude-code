# Moving off Infonetica

Infonetica's ethics system runs under several names: Ethics RM, Ethics Review Manager (ERM) at most Australian universities and health services, and each institution's own branded portal. This guide works for all of them.

## 1. Get your data out

Two ways, and you can use both:

1. **A report saved as CSV.** In the administrator view, run a report or list of applications that includes the columns below, export it to Excel and save it as CSV. Run one report for all applications, open and closed.
2. **The end of contract extract.** Infonetica's public listing on the UK Digital Marketplace says customers receive an extract of their data at the end of the contract, and lists CSV as an export format. Ask for it in writing well before the contract ends. Ask for the application forms and attachments as files too.

The import reads one row per application. Column names vary by institution, so each field accepts the usual names:

| Field | Column names it accepts |
|---|---|
| Reference (required) | Reference, Reference Number, Application ID, Project ID, Protocol Number, Ethics ID |
| Title (required) | Title, Project Title, Application Title, Study Title |
| Investigator (required) | Chief Investigator, Principal Investigator, Lead Researcher, Applicant (or First Name + Last Name) |
| Status (required) | Status, Application Status, Project Status, Stage, Workflow Status |
| Committee | Committee, Review Body, Ethics Committee (an animal committee is recognised by "animal" or "AEC" in its name, or a species column) |
| Pathway | Review Pathway, Review Type, Risk, Risk Level ("low" or "negligible" maps to low risk, "exempt" to exempt, anything else to full) |
| Dates | Date Submitted, Decision Date, Approval Date, Expiry Date (or Approval End Date), Next Report Due |
| Animals | Species, Number of Animals (or Animals Approved) |
| Other | Email, Department (or School, Faculty), Sites, Student |

Statuses map like this: Submitted or Pending validation to submitted; Under review, With committee or Pending decision to in review; More information required or Returned to applicant to revisions; Approved, Approved with conditions or Active to approved; Not approved or Rejected to declined; Withdrawn; Suspended; Closed or Completed to closed. A status the import does not know stops it with the row number: add it to `scripts/lib/import.mjs` or fix the report.

## 2. Import it, test run first

```bash
node scripts/research-ethics.mjs import infonetica applications.csv --dry-run --date-order=DMY
node scripts/research-ethics.mjs import infonetica applications.csv --date-order=DMY
```

`--date-order=DMY` reads 14/03/2025 as 14 March. ISO dates need no flag. The test run reports what it would create and changes nothing. The whole file goes in one transaction: a bad row stops it and nothing is half loaded. Running the same file again updates applications by reference and never duplicates them.

Committees named in the file are created if they do not exist. Add the members afterwards with `/add members` and their categories, so the membership and quorum checks work.

When an approved study has no "Next Report Due" column, the import sets the next report one interval after the most recent anniversary of its approval, and counts how many it set. Check those against your own records.

## 3. What does not come across

- **The application forms and attachments** (the HREA or local form, protocols, information sheets, consent forms). Keep them in your document store, organised by reference. Ask Claude Code to add a link column if you want the record to point at them.
- **Reviewer comments, correspondence and meeting minutes.** Keep them as files from the extract. New ones live here from the day you switch.
- **Site specific assessments and research governance** for other sites. This system covers the ethics review; governance at each site stays with that site's office.
- **The researcher portal.** Researchers no longer log in to submit. They send the completed form and documents to the ethics office, which registers it with `/submit`. If you want a portal, that is a customisation Enterprise DNA builds.

## 4. Check it

```bash
node scripts/research-ethics.mjs approvals
node scripts/research-ethics.mjs reports-due
node scripts/research-ethics.mjs compliance
```

Compare the counts of running approvals and reports due with Infonetica on the same day, then run both side by side for one meeting cycle before you switch off.
