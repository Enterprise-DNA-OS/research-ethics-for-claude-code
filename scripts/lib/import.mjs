// Infonetica import: the applications list from Ethics RM (also run as Ethics Review Manager, ERM),
// from a report saved as CSV or the CSV extract Infonetica supplies when a contract ends.
// One row per application. Report layouts differ by institution, so every field accepts the usual
// names and unused columns are ignored. Committees named in the file are created if missing.
// One transaction per file: a bad row rolls the whole file back. Re-running the same file updates
// applications by reference, never duplicates.
import { readFileSync } from 'node:fs';
import { parseCsv, pick, yesNo } from './csv.mjs';

function isoDate(s, order, where) {
  if (!s) return null;
  const v = s.trim().split(/[ T]/)[0];
  let iso = v;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (!m || !['DMY', 'MDY'].includes(order)) throw Error(`${where}: date "${s}" needs --date-order=DMY or MDY (or ISO dates)`);
    const [d, mo] = order === 'DMY' ? [m[1], m[2]] : [m[2], m[1]];
    iso = `${m[3]}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const t = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== iso) throw Error(`${where}: invalid date "${s}"`);
  return iso;
}
function whole(s, what, where) {
  const v = String(s || '').replace(/[,\s]/g, '');
  if (!v) return null;
  if (!/^\d+$/.test(v)) throw Error(`${where}: ${what} "${s}" is not a whole number`);
  return Number(v);
}
const STATUS = [
  [/^(draft|submitted|new|received|pending validation|awaiting validation)$/i, 'submitted'],
  [/^(under review|in review|review|with committee|with reviewers|validated|on agenda|pending decision|awaiting decision)$/i, 'in review'],
  [/^(more information required|further information requested|revisions? required|returned to applicant|pending response|amendments required)$/i, 'revisions'],
  [/^(approved|approved with conditions|conditionally approved|active|current|ongoing)$/i, 'approved'],
  [/^(not approved|rejected|declined)$/i, 'declined'],
  [/^(withdrawn|cancelled|canceled|abandoned)$/i, 'withdrawn'],
  [/^(suspended|on hold)$/i, 'suspended'],
  [/^(closed|completed|complete|finished|expired and closed)$/i, 'closed'],
];
const PATHWAY = [[/low|negligible/i, 'low risk'], [/exempt/i, 'exempt']];

export async function importInfonetica(db, file, opts = {}) {
  const raw = parseCsv(readFileSync(file, 'utf8'));
  if (!raw.length) throw Error('No rows found in ' + file);
  const [profile] = await db.query('select report_interval_months from office_profile');
  if (!profile) throw Error('Add the office profile before importing: add office_profile {"name":"Your Institute"}');
  const seen = new Set();
  const rows = raw.map((r, i) => {
    const where = `Row ${i + 2}`;
    const get = (...k) => pick(r, ...k).trim();
    const ref = get('Reference', 'Reference Number', 'Application ID', 'Application Reference', 'Project ID', 'Project Number', 'Protocol Number', 'Ethics ID', 'ID');
    if (!ref) throw Error(`${where}: every row needs a Reference column. See docs/replace-infonetica.md`);
    if (seen.has(ref.toLowerCase())) throw Error(`${where}: duplicate reference ${ref}`);
    seen.add(ref.toLowerCase());
    const title = get('Title', 'Project Title', 'Application Title', 'Study Title');
    if (!title) throw Error(`${where}: ${ref} has no title`);
    const investigator = get('Chief Investigator', 'Principal Investigator', 'Lead Researcher', 'Applicant', 'Researcher', 'Owner') || [get('Applicant First Name', 'First Name'), get('Applicant Last Name', 'Last Name', 'Surname')].filter(Boolean).join(' ');
    if (!investigator) throw Error(`${where}: ${ref} has no investigator`);
    const statusText = get('Status', 'Application Status', 'Project Status', 'Stage', 'Workflow Status');
    const status = (STATUS.find(([re]) => re.test(statusText)) || [])[1];
    if (!status) throw Error(`${where}: status "${statusText}" is not one this import knows. Map it in scripts/lib/import.mjs or fix the export.`);
    const committeeText = get('Committee', 'Review Body', 'Ethics Committee', 'Reviewing Committee');
    const species = get('Species', 'Animal Species') || null;
    const animal = /animal|aec/i.test(committeeText) || Boolean(species);
    const decisionText = get('Decision', 'Outcome', 'Decision Outcome');
    const row = {
      ref, title, investigator, status,
      committee: committeeText || (animal ? 'Animal Ethics Committee' : 'Human Research Ethics Committee'),
      kind: animal ? 'animal' : 'human',
      email: get('Email', 'Applicant Email', 'Investigator Email', 'CI Email') || null,
      department: get('Department', 'School', 'Faculty', 'Organisation Unit', 'Unit') || null,
      pathway: (PATHWAY.find(([re]) => re.test(get('Review Pathway', 'Review Type', 'Risk', 'Risk Level', 'Level of Risk'))) || [])[1] || 'full',
      submitted: isoDate(get('Submitted', 'Date Submitted', 'Submission Date', 'Created', 'Date Created'), opts.dateOrder, where),
      decided: isoDate(get('Decision Date', 'Date of Decision', 'Outcome Date'), opts.dateOrder, where),
      approved: isoDate(get('Approval Date', 'Date Approved', 'Approved On', 'Approval Start'), opts.dateOrder, where),
      expires: isoDate(get('Expiry Date', 'Approval End Date', 'Approval Expiry', 'End Date', 'Approved Until'), opts.dateOrder, where),
      reportDue: isoDate(get('Next Report Due', 'Annual Report Due', 'Progress Report Due', 'Report Due'), opts.dateOrder, where),
      conditional: /condition/i.test(decisionText) || /condition/i.test(statusText),
      species,
      animals: whole(get('Number of Animals', 'Animals Approved', 'Approved Numbers', 'Animal Numbers'), 'number of animals', where),
      sites: whole(get('Sites', 'Number of Sites'), 'sites', where) || 1,
      student: yesNo(get('Student', 'Student Project', 'HDR')),
    };
    if (['approved', 'suspended', 'closed'].includes(status) && !row.approved) throw Error(`${where}: ${ref} is ${statusText} but has no approval date`);
    if (status === 'approved' && !row.expires) throw Error(`${where}: ${ref} is approved but has no expiry date: add the Expiry Date column to the report`);
    return row;
  });

  const counts = { committees_created: 0, applications_created: 0, applications_updated: 0, report_dates_set: 0 };
  await db.exec('BEGIN');
  try {
    for (const [i, r] of rows.entries()) {
      try {
        let [c] = await db.query('select * from committees where lower(name) = lower($1)', [r.committee]);
        if (!c) { [c] = await db.query('insert into committees (name, kind) values ($1, $2) returning *', [r.committee, r.kind]); counts.committees_created++; }
        const decided = r.decided || r.approved;
        const decision = r.status === 'declined' ? 'declined' : r.status === 'revisions' ? 'revisions' : ['approved', 'suspended', 'closed'].includes(r.status) ? (r.conditional ? 'approved with conditions' : 'approved') : null;
        let reportDue = r.reportDue;
        if (!reportDue && r.status === 'approved') {
          reportDue = (await db.query(`select (greatest($1::date, (select max(d)::date from (select ($1::date + make_interval(months => $2::int * g)) as d from generate_series(0, 50) g) s where d <= ethics_today())) + make_interval(months => $2::int))::date::text as d`, [r.approved, profile.report_interval_months]))[0].d;
          counts.report_dates_set++;
        }
        const vals = [r.title, c.id, r.pathway, r.investigator, r.email, r.department, r.sites, r.student, r.species, r.animals, r.status,
          r.submitted || r.approved || r.decided, ['in review', 'revisions', 'approved', 'declined', 'suspended', 'closed'].includes(r.status) ? (r.submitted || decided) : null,
          r.status === 'revisions' ? (decided || r.submitted) : null, decided, decision, decided, r.approved, r.expires, reportDue,
          r.status === 'closed' ? (r.expires || decided) : null, r.status === 'closed' ? (r.expires || decided) : null, r.ref];
        if (!vals[11]) vals[11] = (await db.query('select ethics_today()::text as d'))[0].d;
        const [existing] = await db.query('select id from applications where lower(name) = lower($1)', [r.ref]);
        if (existing) {
          await db.query(`update applications set title = $1, committee_id = $2, pathway = $3, investigator = $4, investigator_email = coalesce($5, investigator_email), department = coalesce($6, department),
            sites = $7, student = $8, species = coalesce($9, species), animals_approved = coalesce($10, animals_approved), status = $11, submitted_on = $12, valid_on = coalesce(valid_on, $13),
            clock_stopped_on = $14, decided_on = coalesce($15, decided_on), decision = coalesce($16, decision), letter_sent_on = coalesce(letter_sent_on, $17), approved_on = coalesce($18, approved_on),
            expires_on = coalesce($19, expires_on), next_report_due = coalesce($20, next_report_due), final_report_on = coalesce(final_report_on, $21), closed_on = coalesce(closed_on, $22)
            where id = $23`, [...vals.slice(0, 22), existing.id]);
          counts.applications_updated++;
        } else {
          await db.query(`insert into applications (title, committee_id, pathway, investigator, investigator_email, department, sites, student, species, animals_approved, status, submitted_on, valid_on,
            clock_stopped_on, decided_on, decision, letter_sent_on, approved_on, expires_on, next_report_due, final_report_on, closed_on, name, external_id)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $23)`, vals);
          counts.applications_created++;
        }
      } catch (e) {
        throw Error(`Row ${i + 2}: ${e.message}`);
      }
    }
    if (opts.dryRun) { await db.exec('ROLLBACK'); return [{ dry_run: true, rows: rows.length, ...counts }]; }
    await db.query('insert into audit (name, detail) values ($1, $2)', ['import infonetica', JSON.stringify({ file, ...counts })]);
    await db.exec('COMMIT');
    return [{ rows: rows.length, ...counts }];
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
}
