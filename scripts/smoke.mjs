#!/usr/bin/env node
// npm test: a throwaway database, the schema, the demo ethics office, every command, then the real
// executables. Embedded PGlite by default; TEST_DATABASE_URL runs the same test on Postgres.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { migrate } from './migrate.mjs';
import { seed } from './seed.mjs';
import { run, commands, reads } from './lib/domain.mjs';

const tmp = mkdtempSync(path.join(tmpdir(), 'research-ethics-test-'));
process.env.DATA_DIR = path.join(tmp, 'db');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || '';
process.env.OUTPUT_DIR = tmp;

let db, assertions = 0;
const exercised = new Set();
const call = (c, a = [], o = {}) => { exercised.add(c); return run(db, c, a, o); };
const ok = (x, msg) => { assert.ok(x, msg); assertions++; };
const fails = async (c, a, pattern, o = {}) => { await assert.rejects(() => call(c, a, o), pattern); assertions++; };
const one = async (sql) => (await db.query(sql))[0];
const d = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
const inDays = async (n) => (await one(`select (ethics_today() + ${n})::text as d`)).d;
const rules = async () => (await call('compliance')).map((r) => `${r.rule}:${r.record}`);
const issues = async () => (await call('attention')).map((r) => `${r.issue}:${r.who}`);

try {
  db = await getDb();
  if (process.env.TEST_DATABASE_URL) await db.exec('drop schema public cascade; create schema public;');
  ok((await migrate(db)).ran.length === 1, 'schema applies');
  await seed(db);
  await seed(db);
  ok((await migrate(db)).ran.length === 0, 'migrate is idempotent');
  ok((await call('applications')).length === 16, 'seed is idempotent');

  // Every read runs, and the demo says what it should.
  for (const c of Object.keys(reads)) ok(Array.isArray(await call(c)), c);
  const queue = Object.fromEntries((await call('queue')).map((r) => [r.application, r.stage]));
  ok(queue['HREC-2026-036'] === 'past the decision target' && queue['HREC-2026-038'] === 'chase the researcher' && queue['HREC-2026-041'] === 'check it, overdue' && queue['HREC-2026-040'] === 'reviews out', 'queue stages');
  ok(Number((await call('queue')).find((r) => r.application === 'HREC-2026-038').clock_days) === 31, 'clock stops while with the researcher');
  ok((await call('reviews')).filter((r) => r.days_late > 0).map((r) => r.reviewer).join() === 'Prof David Okafor', 'late reviewer');
  ok((await call('reports-due')).map((r) => `${r.application}:${r.stage}`).join() === 'HREC-2024-018:overdue,HREC-2025-031:due soon', 'reports due');
  ok((await call('expiring')).map((r) => r.application).join() === 'HREC-2024-044,HREC-2021-007', 'expired approvals');
  ok((await call('final-reports')).map((r) => r.application).join() === 'HREC-2024-044,HREC-2021-007', 'final reports owed');
  ok((await call('animals')).find((r) => r.application === 'AEC-2025-004').remaining === -12, 'animal numbers');
  ok((await call('agenda')).length === 3, 'next HREC agenda');
  ok((await call('conditions')).map((r) => r.application).join() === 'HREC-2026-033', 'conditions outstanding');
  ok((await call('membership')).some((r) => r.category === 'lay' && r.members === 2), 'membership by category');
  ok((await call('turnaround')).find((r) => r.pathway === 'low risk').decided === 1, 'turnaround');
  ok((await call('outcomes')).some((r) => r.decision === 'declined'), 'outcomes');
  ok((await call('attention')).length >= 18, 'attention list');
  const found = await rules();
  for (const r of ['ANNUAL-REPORT:HREC-2024-018', 'FINAL-REPORT:HREC-2024-044', 'APPROVAL-CURRENT:HREC-2021-007', 'APPROVAL-CURRENT:HREC-2024-044', 'CONFLICT-OF-INTEREST:HREC-2026-039', 'DECISION-IN-WRITING:HREC-2026-035', 'CONDITIONS-MET:HREC-2026-033', 'SAFETY-REPORTING:HREC-2025-012', 'CONFIDENTIALITY:Margaret Ellis', 'ANIMAL-NUMBERS:AEC-2025-004', 'HREC-MEMBERSHIP:Southern Coast HREC']) ok(found.includes(r), r);
  ok(found.some((r) => r.startsWith('MINUTES:HREC ')), 'minutes rule');
  ok(found.some((r) => r.startsWith('AEC-QUORUM:AEC ')), 'AEC quorum rule');
  ok(!found.some((r) => r.startsWith('AEC-MEMBERSHIP')), 'AEC membership is complete');
  const review = await call('weekly-review');
  ok(review['the queue'].length === 5 && review['reviews late'].length === 1 && review['open safety reports'].length === 2, 'weekly review');

  // Lookups: partial, case-insensitive, by title or investigator; ambiguity lists candidates.
  ok((await call('application', ['2026-040'])).reviews.length === 2, 'application by partial reference');
  ok((await call('application', ['vaping'])).application.name === 'HREC-2026-040', 'application by title');
  ok((await call('application', ['fiona grant'])).amendments.length === 1, 'application by investigator');
  await fails('application', ['HREC-2026-03'], /Ambiguous applications/);
  await fails('application', ['zzz'], /No applications matched/);
  ok((await call('member', ['okafor'])).reviews.length === 3, 'member by partial name');
  await fails('member', ['Dr'], /Ambiguous members/);
  const aecMeeting = (await call('meetings')).find((r) => r.committee === 'Southern Coast AEC' && r.held).meeting;
  ok((await call('meeting', [aecMeeting])).quorum[0].ok === false, 'meeting shows the quorum problem');

  // A new application, end to end.
  const [a] = await call('submit', ['Sun protection habits of outdoor workers', 'HREC', 'Dr Will Harper'], { email: 'will.harper@example.org', department: 'Public Health' });
  const ref = a.name;
  ok(/^HREC-\d{4}-\d{3}$/.test(ref) && a.status === 'submitted', 'submitted and numbered');
  await fails('submit', ['Mice study', 'AEC', 'Dr X'], /species/);
  await fails('submit', ['x', 'HREC', 'Dr X'], /pathway/, { pathway: 'quick' });
  await fails('decide', [ref, 'approved'], /only an application in review/);
  const [v] = await call('validate', [ref]);
  ok(v.status === 'in review' && d(v.valid_on) === await inDays(0), 'validated, clock started');
  await fails('validate', [ref], /only a new submission/);
  await fails('decide', [ref, 'approved'], /no reviewer has looked at it/);
  const [r1] = await call('assign', [ref, 'Margaret Ellis']);
  ok(/confidentiality/.test(r1.note), 'warns of a missing confidentiality undertaking');
  const [r2] = await call('assign', [ref, 'Fletcher']);
  ok(/term ended/.test(r2.note), 'warns of an ended term');
  await call('assign', [ref, 'Okafor']);
  await fails('assign', [ref, 'Kate Morrison'], /No member of this committee/);
  await fails('review', [ref, 'Kowalski', 'approve'], /not assigned/);
  await fails('review', [ref, 'Ellis', 'maybe'], /review <application>/);
  await call('review', [ref, 'Ellis', 'approve', 'Clear and low burden.']);
  await call('conflict', [ref, 'Fletcher', 'Co-author with the investigator']);
  await fails('review', [ref, 'Fletcher', 'approve'], /declared a conflict/);
  const [rv] = await call('review', [ref, 'Okafor', 'approve with conditions', 'Add sunscreen supply details.']);
  ok(/All reviews are in/.test(rv.note), 'conflicted reviewer does not hold up the count');
  await fails('decide', [ref, 'approved'], /it is on none/);
  const nextMeeting = (await call('agenda'))[0].meeting;
  await fails('schedule', [ref, nextMeeting], /agenda for .* closed/);
  await call('schedule', [ref, nextMeeting], { override: 'Chair agreed to a late item' });
  await fails('decide', [ref, 'approved'], /has not been held/);
  const [mt] = await call('add-meeting', ['HREC', await inDays(0)]);
  ok(mt.name.startsWith('HREC '), 'meeting added');
  await call('schedule', [ref, mt.name], { override: 'Extraordinary meeting' });
  for (const m of ['Helen Park', 'Robert Nguyen', 'Sarah', 'Kowalski']) await call('attend', [mt.name, m]);
  const [held] = await call('held', [mt.name]);
  ok(/No quorum: 4 present/.test(held.note), 'quorum counted');
  await fails('decide', [ref, 'approved'], /had no quorum/);
  await call('attend', [mt.name, 'Okafor']);
  await fails('decide', [ref, 'approved with conditions'], /Say what the researcher must do/);
  const [dec] = await call('decide', [ref, 'approved with conditions', 'Add the sunscreen supply to the information sheet.']);
  ok(dec.status === 'approved' && d(dec.expires_on) > await inDays(1800) && d(dec.next_report_due) > await inDays(360) && d(dec.conditions_due_on) === await inDays(30), 'approved with conditions, expiry and report dates set');
  ok((await issues()).includes('conditions not met:' + ref) === false, 'conditions not yet due');
  const [letter] = await call('draft-decision-letter', [ref]);
  const text = readFileSync(letter.file, 'utf8');
  ok(/subject to these conditions/.test(text) && /first progress report is due/.test(text) && /Draft/.test(text), 'decision letter drafted');
  await call('letter', [ref]);
  await call('conditions-met', [ref]);
  await call('minutes', [mt.name]);
  await fails('minutes', [nextMeeting], /has not been held/);

  // Revisions stop the clock; resubmission restarts it.
  const [mt2] = await call('add-meeting', ['HREC', await inDays(-1)]);
  await call('schedule', ['HREC-2026-040', mt2.name], { override: 'Moved to the extraordinary meeting' });
  await call('schedule', ['HREC-2026-039', mt2.name], { override: 'Moved' });
  for (const m of ['Helen Park', 'Robert Nguyen', 'Sarah', 'Kowalski', 'Priya Raman']) await call('attend', [mt2.name, m]);
  await call('attend', [mt2.name, 'Robert Nguyen'], { absent: true });
  await call('attend', [mt2.name, 'Margaret Ellis']);
  ok(/Quorum met/.test((await call('held', [mt2.name]))[0].note), 'quorum met');
  await call('review', ['HREC-2026-040', 'Okafor', 'revisions', 'Recruitment through social media needs a moderation plan.']);
  const [rev] = await call('decide', ['HREC-2026-040', 'revisions', 'Add a moderation plan for social media recruitment.']);
  ok(rev.status === 'revisions' && d(rev.clock_stopped_on) === await inDays(0), 'revisions stop the clock');
  ok(/needs more information/.test(readFileSync((await call('draft-decision-letter', ['HREC-2026-040']))[0].file, 'utf8')), 'revisions letter');
  await db.query("update applications set clock_stopped_on = ethics_today() - 10 where name = 'HREC-2026-040'");
  const [rs] = await call('resubmit', ['HREC-2026-040']);
  ok(rs.status === 'in review' && rs.clock_stop_days === 10 && !rs.meeting_id, 'resubmitted, ten days off the clock');
  ok((await call('reviews')).filter((r) => r.application === 'HREC-2026-040').length === 2, 'same reviewers look again');
  await fails('resubmit', ['HREC-2026-040'], /not waiting on revisions/);

  // Conflict blocks a decision until handled.
  await call('review', ['HREC-2026-039', 'Robert Nguyen', 'approve']);
  await fails('decide', ['HREC-2026-039', 'approved'], /declared a conflict and still returned a review/);

  // Approved research: reports, amendments, events, animals.
  await fails('report', ['HREC-2024-018', 'annual'], /progress\|final/);
  const [rep] = await call('report', ['HREC-2024-018', 'progress', 'Second site recruiting.'], { participants: '130', secure: 'yes' });
  ok(d(rep.next_report_due) > await inDays(360), 'next report date moves on');
  ok(!(await rules()).includes('ANNUAL-REPORT:HREC-2024-018'), 'annual report received');
  const [insecure] = await call('report', ['HREC-2025-031', 'progress'], { secure: 'no' });
  ok(/not held securely/.test(insecure.note), 'insecure records flagged');
  await call('report', ['HREC-2024-044', 'final', 'All facilities finished. Paper in review.']);
  ok(!(await rules()).includes('FINAL-REPORT:HREC-2024-044') && (await call('application', ['HREC-2024-044'])).application.status === 'closed', 'final report closes the study');
  const [rat] = await call('report', ['AEC-2025-004', 'progress'], { animals: '4' });
  ok(/136 against 120 approved/.test(rat.note), 'animal overuse caught on entry');
  await fails('report', ['HREC-2026-029', 'progress'], /reports are on approved research/);
  const [amd] = await call('amend', ['HREC-2025-031', 'Add a carer interview arm']);
  ok(/^AMD-\d{4}$/.test(amd.name), 'amendment numbered');
  await fails('amend', ['HREC-2026-041', 'x'], /amendments are to approved research/);
  await call('decide-amendment', ['AMD-0001', 'approved']);
  await fails('decide-amendment', ['AMD-0001', 'approved'], /was decided/);
  ok(!(await issues()).includes('amendment waiting:HREC-2024-018'), 'amendment decided');
  const [ev] = await call('event', ['HREC-2025-031', 'serious adverse event', await inDays(-6), 'Fall at home after a dose change.']);
  ok(/Reported 6 days after/.test(ev.note) && /Tell the chair today/.test(ev.note), 'late serious adverse event flagged');
  await fails('event', ['HREC-2025-031', 'accident', await inDays(-1), 'x'], /event <application>/);
  await fails('event', ['HREC-2025-031', 'complaint', await inDays(2), 'x'], /future/);
  await call('close-event', ['EV-0002', 'Necropsy found a surgical bleed. Monitoring increased to twice daily.']);
  ok((await call('events')).find((r) => r.name === 'EV-0002').closed_on, 'event closed');
  await call('suspend', ['HREC-2025-012', 'Pending review of the serious adverse event']);
  ok((await call('application', ['HREC-2025-012'])).activity[0].note.startsWith('Suspended'), 'suspension logged');
  await call('withdraw', ['HREC-2026-041', 'Investigator moving institution']);
  await fails('withdraw', ['HREC-2026-041', 'again'], /only an application not yet decided/);
  await call('log', ['HREC-2021-007', 'Called Prof Wright: extension amendment coming this week.']);
  await call('letter', ['HREC-2026-035']);
  ok(!(await rules()).includes('DECISION-IN-WRITING:HREC-2026-035'), 'letter recorded');

  // Membership: fix the gap and the confidentiality record.
  await call('add', ['members', '{"name":"Rev Joseph Tan","committee":"HREC","category":"pastoral","external":true,"confidentiality_signed_on":"' + await inDays(0) + '"}']);
  await call('set', ['members', 'Margaret Ellis', `{"confidentiality_signed_on":"${await inDays(0)}"}`]);
  const after = await rules();
  ok(!after.includes('HREC-MEMBERSHIP:Southern Coast HREC') && !after.includes('CONFIDENTIALITY:Margaret Ellis'), 'membership and confidentiality fixed');
  await fails('add', ['members', '{"name":"No Committee","category":"lay"}'], /needs a committee/);
  await fails('set', ['members', 'Margaret Ellis', '{"salary":1}'], /not writable/);
  await fails('add', ['applications', '{"title":"x"}'], /start with submit/);
  await call('set', ['office_profile', '{"decision_days":90}']);
  ok((await call('queue')).find((r) => r.application === 'HREC-2026-036').stage !== 'past the decision target', 'target changed in plain settings');

  // Animal application with species and numbers; NZ rules switch on with the jurisdiction.
  const [aec] = await call('submit', ['Hoof health on robotic milking farms', 'AEC', 'Dr Rose Carter'], { species: 'Cattle', animals: '80' });
  ok(aec.name.startsWith('AEC-') && aec.animals_approved === 80, 'animal application');
  await call('set', ['office_profile', '{"jurisdiction":"NZ","timezone":"Pacific/Auckland"}']);
  const nz = await rules();
  ok(nz.includes('NZ-CODE-OF-CONDUCT:Southern Coast Research Institute') && nz.some((r) => r.startsWith('AEC-MEMBERSHIP-NZ')), 'NZ animal rules');
  ok((await call('compliance')).find((r) => r.rule === 'ANNUAL-REPORT')?.source.includes('neac') ?? true, 'NZ human source');
  await call('set', ['office_profile', `{"code_approved_until":"${await inDays(400)}"}`]);
  ok(!(await rules()).some((r) => r.startsWith('NZ-CODE')), 'code approval recorded');
  await call('set', ['office_profile', '{"jurisdiction":"AU","timezone":"Australia/Sydney"}']);

  // Drafts: reminders and the agenda.
  ok(/annual progress report/.test(readFileSync((await call('draft-report-reminder', ['HREC-2025-031']))[0].file, 'utf8')), 'report reminder');
  ok(/final report/.test(readFileSync((await call('draft-report-reminder', ['HREC-2021-007']))[0].file, 'utf8')), 'final report reminder for an expired approval');
  ok(/HREC-2026-040/.test(readFileSync((await call('draft-reviewer-reminder', ['Okafor']))[0].file, 'utf8')), 'reviewer reminder');
  await fails('draft-reviewer-reminder', ['Joanne Barker'], /no reviews open/);
  const agenda = readFileSync((await call('draft-agenda', [nextMeeting]))[0].file, 'utf8');
  ok(/Declarations of interest/.test(agenda) && /HREC-2026-036/.test(agenda) && /Safety and conduct/.test(agenda), 'agenda pack');

  // Import from Infonetica: test run first, then for real, then again (updates, no duplicates).
  const csv = path.join(REPO_ROOT, 'fixtures', 'infonetica-applications.csv');
  await fails('import', ['infonetica', csv], /date-order/);
  await fails('import', ['ethicsrm', csv], /import infonetica/);
  const before = (await call('applications')).length;
  const [dry] = await call('import', ['infonetica', csv], { dryRun: true, dateOrder: 'DMY' });
  ok(dry.dry_run && dry.applications_created === 6 && (await call('applications')).length === before, 'dry run changes nothing');
  const [imp] = await call('import', ['infonetica', csv], { dateOrder: 'DMY' });
  ok(imp.applications_created === 6 && imp.committees_created === 2 && imp.report_dates_set === 3, 'imported with committees and report dates');
  const [again] = await call('import', ['infonetica', csv], { dateOrder: 'DMY' });
  ok(again.applications_updated === 6 && again.applications_created === 0, 're-import updates');
  const sheep = (await call('application', ['AE-2025-0011'])).application;
  ok(sheep.kind === 'animal' && sheep.animals_approved === 24 && sheep.status === 'approved' && d(sheep.expires_on) === '2028-02-20', 'animal row mapped');
  ok((await call('application', ['ETH-2025-0144'])).application.decision === 'approved with conditions', 'conditional decision mapped');
  ok((await call('application', ['ETH-2026-0019'])).application.status === 'revisions', 'revisions mapped');

  // Export.
  const exp = path.join(tmp, 'export.json');
  const [ex] = await call('export', [exp]);
  ok(ex.records > 100 && JSON.parse(readFileSync(exp, 'utf8')).format === 'research-ethics-v1', 'export');

  // Every command is exercised.
  for (const c of ['help', 'add', 'set', 'audit']) await call(c, c === 'add' ? ['committees', '{"name":"Low Risk Panel","kind":"human","quorum":2}'] : c === 'set' ? ['committees', 'Low Risk Panel', '{"quorum":3}'] : []);
  const missed = commands.filter((c) => !exercised.has(c));
  ok(!missed.length, 'not exercised: ' + missed.join(', '));
  ok((await call('audit')).length > 30, 'audit trail');
} finally {
  await db?.close();
}

// The real executables against the same throwaway database.
const node = process.execPath;
const sh = (args) => spawnSync(node, args, { cwd: REPO_ROOT, env: process.env, encoding: 'utf8', windowsHide: true });
const cli = sh(['scripts/research-ethics.mjs', 'attention']);
ok(cli.status === 0 && /who/.test(cli.stdout), 'CLI runs: ' + cli.stderr);
const js = sh(['scripts/research-ethics.mjs', 'queue', '--json']);
ok(js.status === 0 && Array.isArray(JSON.parse(js.stdout)), 'CLI --json');
const bad = sh(['scripts/research-ethics.mjs', 'application', 'HREC-2026-03']);
ok(bad.status === 1 && /Ambiguous/.test(bad.stderr), 'CLI exits 1 on an ambiguous name');
ok(sh(['scripts/research-ethics.mjs', 'queue', '--bogus']).status === 1, 'CLI rejects unknown flags');
const view = sh(['scripts/view.mjs']);
ok(view.status === 0 && readdirSync(path.join(tmp, 'views')).length >= 3, 'views render: ' + view.stderr);
const docs = sh(['scripts/docs.mjs']);
ok(docs.status === 0 && existsSync(path.join(tmp, 'docs-out')) && /document\(s\) rendered/.test(docs.stdout), 'documents render: ' + docs.stderr);
const cmds = readdirSync(path.join(REPO_ROOT, '.claude', 'commands')).filter((f) => f.endsWith('.md') && f !== 'README.md');
for (const f of cmds) ok(/^---\ndescription: .+\n---/.test(readFileSync(path.join(REPO_ROOT, '.claude', 'commands', f), 'utf8').replace(/\r\n/g, '\n')), `command ${f} has a description`);

rmSync(tmp, { recursive: true, force: true });
console.log(`PASS: ${assertions} assertions, ${commands.length} CLI commands, ${cmds.length} slash commands`);
