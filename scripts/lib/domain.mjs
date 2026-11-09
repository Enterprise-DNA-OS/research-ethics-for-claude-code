// Every command the CLI and the slash commands run. Reads are plain SQL; writes run in a
// transaction, enforce the committee's terms and the rules in docs/compliance.md, and leave an audit row.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { REPO_ROOT } from './db.mjs';
import { importInfonetica } from './import.mjs';

// Fields `add` and `set` may write, per record type.
export const fields = {
  committees: ['name', 'kind', 'registration', 'quorum', 'active'],
  members: ['name', 'email', 'committee', 'category', 'external', 'gender', 'appointed_on', 'term_ends_on', 'confidentiality_signed_on', 'active'],
  applications: ['title', 'pathway', 'investigator', 'investigator_email', 'department', 'sites', 'student', 'species', 'animals_approved', 'expires_on', 'next_report_due', 'conditions_due_on'],
  office_profile: ['name', 'jurisdiction', 'state', 'timezone', 'decision_days', 'validate_days', 'review_days', 'revisions_chase_days', 'letter_days', 'report_reminder_days', 'report_interval_months', 'final_report_days', 'approval_years', 'safety_report_days', 'minutes_confirm_days', 'amendment_days', 'code_approved_until'],
};
const RESOLVABLE = ['committees', 'members', 'meetings', 'applications', 'amendments', 'events'];
export const RECOMMENDATIONS = ['approve', 'approve with conditions', 'revisions', 'decline'];
export const DECISIONS = ['approved', 'approved with conditions', 'revisions', 'declined'];
export const EVENT_KINDS = ['serious adverse event', 'protocol deviation', 'complaint', 'breach', 'unexpected death'];
const SERIOUS = "('serious adverse event', 'unexpected death')";

const QUEUE = `select d.name as application, d.committee, d.pathway, d.status, d.investigator, d.submitted_on, d.valid_on, d.meeting, d.meets_on,
    d.reviewers, d.reviews_out, d.clock_days, d.with_researcher_days,
    case when d.status = 'submitted' and ethics_today() - d.submitted_on > p.validate_days then 'check it, overdue'
         when d.status = 'submitted' then 'to check'
         when d.status = 'revisions' and d.with_researcher_days > p.revisions_chase_days then 'chase the researcher'
         when d.status = 'revisions' then 'with the researcher'
         when d.clock_days > p.decision_days then 'past the decision target'
         when d.reviewers = 0 then 'no reviewers'
         when d.reviews_out > 0 then 'reviews out'
         when d.pathway = 'full' and d.meeting is null then 'needs a meeting'
         else 'ready to decide' end as stage
  from application_detail d cross join office_profile p
  where d.status in ('submitted', 'in review', 'revisions')
  order by d.submitted_on`;

export const reads = {
  profile: 'select name, jurisdiction, state, timezone, decision_days, validate_days, review_days, revisions_chase_days, letter_days, report_reminder_days, report_interval_months, final_report_days, approval_years, safety_report_days, minutes_confirm_days, amendment_days, code_approved_until from office_profile',
  committees: `select c.name, c.kind, c.registration, c.quorum, c.active,
      (select count(*)::int from members m where m.committee_id = c.id and m.active) as members,
      (select count(*)::int from applications a where a.committee_id = c.id and a.status in ('submitted', 'in review', 'revisions')) as in_progress,
      (select count(*)::int from applications a where a.committee_id = c.id and a.status = 'approved') as approved_running
    from committees c order by c.name`,
  members: `select c.name as committee, m.name, m.category, m.external, m.term_ends_on, m.confidentiality_signed_on, m.active,
      (select count(*)::int from reviews r where r.member_id = m.id and r.returned_on is null and r.conflict is null) as reviews_open
    from members m join committees c on c.id = m.committee_id order by c.name, m.active desc, m.category, m.name`,
  membership: 'select committee, kind, category, members, external, names from membership order by committee, category',
  meetings: `select a.name as meeting, a.committee, a.meets_on, a.held, a.present, a.categories, a.minutes_confirmed_on,
      (select count(*)::int from applications x where x.meeting_id = a.id) as items
    from meeting_attendance a order by a.meets_on desc`,
  agenda: `select m.name as meeting, m.meets_on, m.closes_on, d.name as application, d.title, d.pathway, d.reviewers, d.reviews_out, d.status
    from meetings m join application_detail d on d.meeting_id = m.id
    where m.meets_on >= ethics_today() and not m.held order by m.meets_on, d.name`,
  queue: QUEUE,
  reviews: `select a.name as application, m.name as reviewer, r.assigned_on, r.due_on, ethics_today() - r.due_on as days_late
    from reviews r join applications a on a.id = r.application_id join members m on m.id = r.member_id
    where r.returned_on is null and r.conflict is null and a.status in ('submitted', 'in review') order by r.due_on`,
  decisions: `select name as application, committee, pathway, decision, decided_on, clock_days, letter_sent_on
    from application_detail where decided_on >= ethics_today() - 90 order by decided_on desc`,
  conditions: `select name as application, investigator, decided_on, conditions, conditions_due_on, ethics_today() - conditions_due_on as days_late
    from applications where decision = 'approved with conditions' and conditions_met_on is null and status = 'approved' order by conditions_due_on`,
  approvals: 'select name as application, title, committee, investigator, approved_on, expires_on, days_to_expiry, next_report_due, days_to_report, last_report_on from approvals order by expires_on',
  expiring: `select name as application, investigator, expires_on, days_to_expiry,
      case when days_to_expiry < 0 then 'expired, still open' else 'expiring' end as stage
    from approvals where days_to_expiry <= 90 order by expires_on`,
  'reports-due': `select a.name as application, a.investigator, a.next_report_due, a.days_to_report, a.last_report_on,
      case when a.days_to_report < 0 then 'overdue' else 'due soon' end as stage
    from approvals a cross join office_profile p
    where a.days_to_expiry >= 0 and a.next_report_due <= ethics_today() + p.report_reminder_days order by a.next_report_due`,
  'final-reports': `select d.name as application, d.investigator, d.expires_on, d.expires_on + p.final_report_days as final_due, ethics_today() - (d.expires_on + p.final_report_days) as days_late
    from application_detail d cross join office_profile p
    where d.status in ('approved', 'suspended') and d.final_report_on is null and d.expires_on < ethics_today() order by d.expires_on`,
  amendments: `select x.name, a.name as application, x.summary, x.submitted_on, x.decided_on, x.outcome,
      case when x.decided_on is null then ethics_today() - x.submitted_on end as days_open
    from amendments x join applications a on a.id = x.application_id order by x.submitted_on desc`,
  events: `select e.name, a.name as application, e.kind, e.occurred_on, e.reported_on, e.reported_on - e.occurred_on as days_to_report, e.closed_on, e.summary
    from events e join applications a on a.id = e.application_id order by e.occurred_on desc`,
  animals: `select name as application, species, investigator, animals_approved, animals_used, animals_approved - animals_used as remaining, expires_on
    from approvals where animals_approved is not null order by animals_approved - animals_used`,
  turnaround: `select d.committee, d.pathway, count(*)::int as decided,
      percentile_cont(0.5) within group (order by d.clock_days) as median_days,
      max(d.clock_days) as slowest_days,
      round(100.0 * count(*) filter (where d.clock_days <= p.decision_days) / count(*)) as within_target_pct
    from application_detail d cross join office_profile p
    where d.decided_on >= ethics_today() - 365 and d.clock_days is not null
    group by d.committee, d.pathway, p.decision_days order by d.committee, d.pathway`,
  workload: `select c.name as committee, m.name as reviewer, m.category,
      count(r.id) filter (where r.assigned_on >= ethics_today() - 365)::int as assigned_12m,
      count(r.id) filter (where r.returned_on is null and r.conflict is null)::int as open,
      count(r.id) filter (where r.returned_on > r.due_on)::int as returned_late,
      round(avg(r.returned_on - r.assigned_on) filter (where r.returned_on is not null)) as avg_days
    from members m join committees c on c.id = m.committee_id left join reviews r on r.member_id = m.id
    where m.active group by c.name, m.name, m.category order by c.name, assigned_12m desc, m.name`,
  outcomes: `select committee, decision, count(*)::int as decisions
    from application_detail where decided_on >= ethics_today() - 365 and decision is not null group by committee, decision order by committee, decisions desc`,
  applications: 'select name as application, title, committee, pathway, status, investigator, submitted_on, decided_on, expires_on from application_detail order by submitted_on desc, name',
  activity: 'select a.name as application, x.happened_on, x.note from activity x left join applications a on a.id = x.application_id order by x.happened_on desc, x.created_at desc',
  audit: 'select name, record_id, detail, created_at from audit order by created_at desc',
};

const ACTIONS = ['application', 'member', 'meeting', 'attention', 'compliance', 'weekly-review', 'submit', 'validate', 'assign', 'conflict', 'review', 'schedule', 'add-meeting', 'attend', 'held', 'minutes', 'decide', 'letter', 'resubmit', 'conditions-met', 'amend', 'decide-amendment', 'report', 'event', 'close-event', 'suspend', 'withdraw', 'log', 'add', 'set', 'draft-decision-letter', 'draft-report-reminder', 'draft-reviewer-reminder', 'draft-agenda', 'import', 'export', 'help'];
export const commands = [...Object.keys(reads), ...ACTIONS];

// ------------------------------------------------------------------ helpers

export async function resolve(db, type, q) {
  if (!q) throw Error(`Supply a ${type.replace(/s$/, '')} name or ID`);
  if (!RESOLVABLE.includes(type)) throw Error(`Unknown record type ${type}`);
  const extra = type === 'applications' ? ' or title ilike $2 or investigator ilike $2' : '';
  const rows = await db.query(`select * from ${type} where id::text ilike $1 or name ilike $2${extra} order by name`, [q + '%', '%' + q + '%']);
  const exact = rows.filter((r) => r.name.toLowerCase() === q.toLowerCase() || r.id === q);
  if (exact.length === 1) return exact[0];
  if (type === 'applications' && rows.length > 1) {
    const open = rows.filter((r) => ['submitted', 'in review', 'revisions', 'approved'].includes(r.status));
    if (open.length === 1) return open[0];
  }
  if (rows.length !== 1) throw Error(rows.length ? `Ambiguous ${type}, pick one:\n${rows.map((r) => `${r.name}  ${r.title || r.category || ''}`.trim()).join('\n')}` : `No ${type} matched "${q}"`);
  return rows[0];
}
const app = (db, q) => resolve(db, 'applications', q).then((a) => db.query('select * from application_detail where id = $1', [a.id])).then((r) => r[0]);
// A member of one committee, by partial name.
async function memberOf(db, committeeId, q) {
  if (!q) throw Error('Supply a member name');
  const rows = await db.query('select * from members where committee_id = $1 and (name ilike $2 or id::text ilike $3) order by name', [committeeId, '%' + q + '%', q + '%']);
  const exact = rows.filter((r) => r.name.toLowerCase() === q.toLowerCase());
  if (exact.length === 1) return exact[0];
  if (rows.length !== 1) throw Error(rows.length ? `Ambiguous member, pick one:\n${rows.map((r) => r.name).join('\n')}` : `No member of this committee matched "${q}"`);
  return rows[0];
}
export async function transaction(db, fn) {
  await db.exec('BEGIN');
  try { const out = await fn(); await db.exec('COMMIT'); return out; } catch (e) { await db.exec('ROLLBACK'); throw e; }
}
async function audit(db, name, recordId, detail) {
  await db.query('insert into audit (name, record_id, detail) values ($1, $2, $3)', [name, recordId, JSON.stringify(detail)]);
}
function date(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '') || new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) !== s) throw Error(`Use a valid YYYY-MM-DD date, not "${s}"`);
  return s;
}
function count(s, what) {
  if (!/^\d+$/.test(String(s ?? ''))) throw Error(`Use a whole number for ${what}, not "${s}"`);
  return Number(s);
}
async function profile(db) {
  const [p] = await db.query('select * from office_profile');
  if (!p) throw Error('No office profile. Add one: add office_profile {"name":"Your Institute"}');
  return p;
}
async function today(db) { return (await db.query('select ethics_today()::text as d'))[0].d; }
async function plusDays(db, n, from = null) { return (await db.query('select (coalesce($1::date, ethics_today()) + $2::int)::text as d', [from, n]))[0].d; }
async function plusMonths(db, n, from) { return (await db.query("select ($1::date + make_interval(months => $2::int))::date::text as d", [from, n]))[0].d; }
async function nextName(db, table, prefix, width) {
  const [r] = await db.query(`select coalesce(max(substring(name from ${prefix.length + 1})::int) filter (where name ~ ('^' || $1 || '[0-9]+$')), 0) + 1 as n from ${table}`, [prefix]);
  return prefix + String(r.n).padStart(width, '0');
}
function draftFile(kind, id, body) {
  const dir = path.join(process.env.OUTPUT_DIR || REPO_ROOT, 'drafts');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${kind}-${String(id).slice(0, 8)}-${randomUUID().slice(0, 8)}.md`);
  writeFileSync(file, body + '\n');
  return [{ file }];
}
const day = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? '' : String(v).slice(0, 10));
const first = (name) => String(name).replace(/^(dr|prof|professor|rev|mr|mrs|ms)\.?\s+/i, '').split(' ')[0];
const plural = (n, w) => `${n} ${w}${Number(n) === 1 ? '' : 's'}`;

// Which membership categories a committee is missing, by its kind and the office's jurisdiction.
export async function membershipGaps(db, committee, jurisdiction) {
  const rows = await db.query('select category, count(*)::int as n from members where committee_id = $1 and active group by category', [committee.id]);
  const n = Object.fromEntries(rows.map((r) => [r.category, r.n]));
  const total = rows.reduce((s, r) => s + r.n, 0);
  const gaps = [];
  const need = (cat, min, label) => { if ((n[cat] || 0) < min) gaps.push(`${label}: has ${n[cat] || 0}, needs ${min}`); };
  if (committee.kind === 'human') {
    need('chair', 1, 'chair'); need('lay', 2, 'lay people'); need('care', 1, 'professional care, counselling or treatment');
    need('pastoral', 1, 'pastoral care'); need('lawyer', 1, 'lawyer'); need('researcher', 2, 'current research experience');
    if (total < 8) gaps.push(`members: has ${total}, needs at least 8`);
  } else if (jurisdiction === 'NZ') {
    need('vet', 1, 'veterinarian'); need('welfare', 1, 'animal welfare organisation nominee'); need('lay', 1, 'lay member nominated by a council');
    if (total < 4) gaps.push(`members: has ${total}, needs at least 4`);
  } else {
    need('chair', 1, 'chair'); need('A', 1, 'Category A (veterinarian)'); need('B', 1, 'Category B (researcher)');
    need('C', 1, 'Category C (animal welfare)'); need('D', 1, 'Category D (independent)');
    if (total && (n.C || 0) + (n.D || 0) < total / 3) gaps.push(`Categories C and D: ${(n.C || 0) + (n.D || 0)} of ${total}, need at least a third`);
  }
  return gaps;
}
// Whether a held meeting could decide: enough members, and on an Australian AEC every category present.
async function meetingQuorum(db, meetingId, jurisdiction) {
  const [m] = await db.query('select * from meeting_attendance where id = $1', [meetingId]);
  if (!m) return { ok: false, why: 'meeting not found' };
  const cats = m.categories ? m.categories.split(',') : [];
  if (m.present < m.quorum) return { ok: false, why: `${m.present} present, quorum is ${m.quorum}` };
  if (m.kind === 'animal' && jurisdiction !== 'NZ') {
    const missing = ['A', 'B', 'C', 'D'].filter((c) => !cats.includes(c));
    if (missing.length) return { ok: false, why: `no Category ${missing.join(', ')} member present` };
  }
  return { ok: true, why: '' };
}

// ------------------------------------------------------------------ run

export async function run(db, cmd, args = [], opts = {}) {
  if (cmd === 'help') return commands.map((command) => ({ command }));
  if (reads[cmd]) return db.query(reads[cmd]);

  if (cmd === 'application') {
    const a = await app(db, args[0]);
    return {
      application: a,
      reviews: await db.query('select m.name as reviewer, m.category, r.assigned_on, r.due_on, r.returned_on, r.recommendation, r.conflict, r.comments from reviews r join members m on m.id = r.member_id where r.application_id = $1 order by r.assigned_on, m.name', [a.id]),
      amendments: await db.query('select name, summary, submitted_on, decided_on, outcome from amendments where application_id = $1 order by submitted_on', [a.id]),
      reports: await db.query('select kind, received_on, participants, animals_used, records_secure, summary from reports where application_id = $1 order by received_on', [a.id]),
      events: await db.query('select name, kind, occurred_on, reported_on, closed_on, summary from events where application_id = $1 order by occurred_on', [a.id]),
      activity: await db.query('select happened_on, note from activity where application_id = $1 order by happened_on desc', [a.id]),
    };
  }
  if (cmd === 'member') {
    const m = await resolve(db, 'members', args[0]);
    return {
      member: m,
      reviews: await db.query('select a.name as application, r.assigned_on, r.due_on, r.returned_on, r.recommendation, r.conflict from reviews r join applications a on a.id = r.application_id where r.member_id = $1 order by r.assigned_on desc', [m.id]),
      meetings: await db.query('select mt.name as meeting, mt.meets_on, at.present from attendance at join meetings mt on mt.id = at.meeting_id where at.member_id = $1 order by mt.meets_on desc', [m.id]),
    };
  }
  if (cmd === 'meeting') {
    const m = await resolve(db, 'meetings', args[0]);
    const [p] = await db.query('select jurisdiction from office_profile');
    return {
      meeting: (await db.query('select * from meeting_attendance where id = $1', [m.id]))[0],
      quorum: m.held ? [await meetingQuorum(db, m.id, p?.jurisdiction)] : [],
      attendance: await db.query('select mb.name, mb.category, at.present from attendance at join members mb on mb.id = at.member_id where at.meeting_id = $1 order by mb.category, mb.name', [m.id]),
      agenda: await db.query('select name as application, title, pathway, status, reviewers, reviews_out, decision from application_detail where meeting_id = $1 order by name', [m.id]),
    };
  }
  if (cmd === 'attention') return attention(db);
  if (cmd === 'compliance') return compliance(db);
  if (cmd === 'weekly-review') {
    const queue = await run(db, 'queue');
    return {
      'the queue': queue,
      'next meetings': await run(db, 'agenda'),
      'reviews late': (await run(db, 'reviews')).filter((r) => r.days_late > 0),
      'decided in the last 90 days': await run(db, 'decisions'),
      'reports due or late': await run(db, 'reports-due'),
      'approvals expiring': await run(db, 'expiring'),
      'open safety reports': (await run(db, 'events')).filter((r) => !r.closed_on),
      turnaround: await run(db, 'turnaround'),
    };
  }
  if (cmd === 'import') {
    const [kind, file] = args;
    if (kind !== 'infonetica' || !file) throw Error('import infonetica <applications.csv> [--dry-run] [--date-order=DMY|MDY]');
    return importInfonetica(db, file, opts);
  }
  if (cmd === 'export') {
    if (!args[0]) throw Error('export <file.json>');
    const out = { format: 'research-ethics-v1', exported_at: new Date().toISOString() };
    await transaction(db, async () => {
      for (const t of ['office_profile', 'committees', 'members', 'meetings', 'attendance', 'applications', 'reviews', 'amendments', 'reports', 'events', 'activity', 'audit']) {
        out[t] = await db.query(`select * from ${t} order by created_at, id`);
      }
    });
    writeFileSync(args[0], JSON.stringify(out, null, 2));
    return [{ file: path.resolve(args[0]), records: Object.values(out).filter(Array.isArray).reduce((n, a) => n + a.length, 0) }];
  }
  if (cmd.startsWith('draft-')) return draft(db, cmd, args);

  if (!ACTIONS.includes(cmd)) throw Error(`Unknown command "${cmd}". Run help.`);
  return transaction(db, async () => {
    const rows = await act(db, cmd, args, opts);
    await audit(db, cmd, rows[0]?.id || null, { arguments: args, override: opts.override || undefined });
    return rows;
  });
}

async function act(db, cmd, args, opts) {
  const p = await profile(db);
  const now = await today(db);
  const note = (row, ...notes) => [{ ...row, note: notes.filter(Boolean).join(' ') || undefined }];

  if (cmd === 'submit') {
    const [title, committeeQ, investigator] = args;
    if (!title || !committeeQ || !investigator) throw Error('submit "<title>" <committee> "<investigator>" [--pathway=full|low risk|exempt --email= --department= --sites= --species= --animals= --student]');
    const c = await resolve(db, 'committees', committeeQ);
    if (!c.active) throw Error(`${c.name} is not active`);
    const pathway = opts.pathway || 'full';
    if (!['full', 'low risk', 'exempt'].includes(pathway)) throw Error('--pathway is full, low risk or exempt');
    if (c.kind === 'animal' && (!opts.species || opts.animals == null)) throw Error('An animal application needs --species= and --animals= (the number asked for)');
    const name = await nextName(db, 'applications', `${c.kind === 'animal' ? 'AEC' : 'HREC'}-${now.slice(0, 4)}-`, 3);
    const [a] = await db.query(`insert into applications (name, title, committee_id, pathway, investigator, investigator_email, department, sites, student, species, animals_approved)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [name, title, c.id, pathway, investigator, opts.email || null, opts.department || null, opts.sites ? count(opts.sites, 'sites') || 1 : 1, Boolean(opts.student), opts.species || null, opts.animals != null ? count(opts.animals, 'animals') : null]);
    return note(a, `Check it is complete by ${await plusDays(db, p.validate_days)} (validate).`);
  }
  if (cmd === 'validate') {
    const a = await app(db, args[0]);
    if (a.status !== 'submitted') throw Error(`${a.name} is ${a.status}; only a new submission is validated`);
    const [r] = await db.query("update applications set valid_on = ethics_today(), status = 'in review' where id = $1 returning *", [a.id]);
    return note(r, `Decision target: ${await plusDays(db, p.decision_days)} with the clock running.`, a.pathway === 'full' ? 'Assign reviewers and put it on a meeting.' : 'Assign a reviewer.');
  }
  if (cmd === 'assign') {
    const a = await app(db, args[0]);
    if (!['submitted', 'in review'].includes(a.status)) throw Error(`${a.name} is ${a.status}; reviewers are assigned while it is in review`);
    const m = await memberOf(db, a.committee_id, args[1]);
    if (!m.active) throw Error(`${m.name} is not an active member`);
    if (m.name.toLowerCase().includes(String(a.investigator).toLowerCase().replace(/^(dr|prof)\s+/i, '')) || String(a.investigator).toLowerCase().includes(m.name.toLowerCase().replace(/^(dr|prof)\s+/i, ''))) throw Error(`${m.name} is the investigator on ${a.name}; a member never reviews their own application`);
    const due = opts.due ? date(opts.due) : await plusDays(db, p.review_days);
    const [r] = await db.query(`insert into reviews (application_id, member_id, due_on) values ($1, $2, $3)
      on conflict (application_id, member_id) do update set due_on = excluded.due_on returning *`, [a.id, m.id, due]);
    const notes = [];
    if (m.term_ends_on && day(m.term_ends_on) < now) notes.push(`${m.name}'s term ended ${day(m.term_ends_on)}.`);
    if (!m.confidentiality_signed_on) notes.push(`${m.name} has no signed confidentiality undertaking on file.`);
    return note({ ...r, application: a.name, reviewer: m.name }, ...notes);
  }
  if (cmd === 'conflict') {
    const a = await app(db, args[0]);
    const m = await memberOf(db, a.committee_id, args[1]);
    const why = args.slice(2).join(' ');
    if (!why) throw Error('conflict <application> <member> "<the interest declared>"');
    const [r] = await db.query(`insert into reviews (application_id, member_id, due_on, conflict) values ($1, $2, ethics_today(), $3)
      on conflict (application_id, member_id) do update set conflict = excluded.conflict returning *`, [a.id, m.id, why]);
    return note({ ...r, application: a.name, reviewer: m.name }, r.returned_on ? 'A review was already returned: it no longer counts, and the member leaves the room when this application is discussed. Assign another reviewer.' : 'The member does not review this application and leaves the room when it is discussed.');
  }
  if (cmd === 'review') {
    const a = await app(db, args[0]);
    const m = await memberOf(db, a.committee_id, args[1]);
    const rec = args[2];
    if (!RECOMMENDATIONS.includes(rec)) throw Error(`review <application> <member> <${RECOMMENDATIONS.join('|')}> ["comments"]`);
    const [r0] = await db.query('select * from reviews where application_id = $1 and member_id = $2', [a.id, m.id]);
    if (!r0) throw Error(`${m.name} is not assigned to ${a.name}. Run assign first.`);
    if (r0.conflict && !opts.override) throw Error(`${m.name} declared a conflict on ${a.name} (${r0.conflict}). A conflicted member does not review it.`);
    const [r] = await db.query('update reviews set returned_on = ethics_today(), recommendation = $2, comments = $3 where id = $1 returning *', [r0.id, rec, args.slice(3).join(' ') || null]);
    const [left] = await db.query('select reviews_out from application_detail where id = $1', [a.id]);
    return note({ ...r, application: a.name, reviewer: m.name }, day(r0.due_on) < now ? `Returned ${plural((await db.query('select ethics_today() - $1::date as n', [r0.due_on]))[0].n, 'day')} late.` : '', left.reviews_out ? `${left.reviews_out} still out.` : 'All reviews are in.');
  }
  if (cmd === 'schedule') {
    const a = await app(db, args[0]);
    const m = await resolve(db, 'meetings', args[1]);
    if (m.committee_id !== a.committee_id) throw Error(`${m.name} is not a meeting of ${a.committee}`);
    if (m.held) throw Error(`${m.name} has been held`);
    if (day(m.closes_on) < now && !opts.override) throw Error(`The agenda for ${m.name} closed on ${day(m.closes_on)}. Use the next meeting, or --override="<reason>" if the chair agreed`);
    const [r] = await db.query('update applications set meeting_id = $2 where id = $1 returning *', [a.id, m.id]);
    return note({ ...r, meeting: m.name });
  }
  if (cmd === 'add-meeting') {
    const [committeeQ, on] = args;
    if (!committeeQ || !on) throw Error('add-meeting <committee> <YYYY-MM-DD> [--closes=YYYY-MM-DD]');
    const c = await resolve(db, 'committees', committeeQ);
    date(on);
    const closes = opts.closes ? date(opts.closes) : await plusDays(db, -14, on);
    const [r] = await db.query('insert into meetings (name, committee_id, meets_on, closes_on) values ($1, $2, $3, $4) returning *', [`${c.kind === 'animal' ? 'AEC' : 'HREC'} ${on}`, c.id, on, closes]);
    return [r];
  }
  if (cmd === 'attend') {
    const m = await resolve(db, 'meetings', args[0]);
    const mb = await memberOf(db, m.committee_id, args[1]);
    const [r] = await db.query(`insert into attendance (meeting_id, member_id, present) values ($1, $2, $3)
      on conflict (meeting_id, member_id) do update set present = excluded.present returning *`, [m.id, mb.id, !opts.absent]);
    return [{ ...r, meeting: m.name, member: mb.name }];
  }
  if (cmd === 'held') {
    const m = await resolve(db, 'meetings', args[0]);
    if (day(m.meets_on) > now) throw Error(`${m.name} is on ${day(m.meets_on)}, not yet`);
    const [r] = await db.query('update meetings set held = true where id = $1 returning *', [m.id]);
    const q = await meetingQuorum(db, m.id, p.jurisdiction);
    return note(r, q.ok ? 'Quorum met.' : `No quorum: ${q.why}. Decisions at this meeting will be refused.`);
  }
  if (cmd === 'minutes') {
    const m = await resolve(db, 'meetings', args[0]);
    if (!m.held) throw Error(`${m.name} has not been held`);
    return db.query('update meetings set minutes_confirmed_on = ethics_today() where id = $1 returning *', [m.id]);
  }
  if (cmd === 'decide') {
    const a = await app(db, args[0]);
    const decision = args[1];
    if (!DECISIONS.includes(decision)) throw Error(`decide <application> <${DECISIONS.join('|')}> ["conditions or the changes asked for"] [--due=YYYY-MM-DD]`);
    if (a.status !== 'in review') throw Error(`${a.name} is ${a.status}; only an application in review is decided`);
    const text = args.slice(2).join(' ') || null;
    if (['approved with conditions', 'revisions'].includes(decision) && !text) throw Error(`Say what the researcher must do: decide ${a.name} "${decision}" "<conditions>"`);
    const blockers = [];
    if (a.reviewers === 0) blockers.push('no reviewer has looked at it');
    if (a.reviews_out > 0) blockers.push(`${plural(a.reviews_out, 'review')} still out`);
    if (a.pathway === 'full') {
      if (!a.meeting_id) blockers.push('a full review is decided at a meeting and it is on none');
      else {
        const [m] = await db.query('select * from meetings where id = $1', [a.meeting_id]);
        if (!m.held) blockers.push(`${m.name} has not been held`);
        else { const q = await meetingQuorum(db, m.id, p.jurisdiction); if (!q.ok) blockers.push(`${m.name} had no quorum (${q.why})`); }
      }
    }
    const [conf] = await db.query('select m.name from reviews r join members m on m.id = r.member_id where r.application_id = $1 and r.conflict is not null and r.returned_on is not null', [a.id]);
    if (conf) blockers.push(`${conf.name} declared a conflict and still returned a review`);
    if (blockers.length && !opts.override) throw Error(`Cannot decide ${a.name}: ${blockers.join('; ')}. Fix it, or --override="<reason>" if the chair agreed`);
    let r;
    if (decision === 'revisions') {
      [r] = await db.query("update applications set status = 'revisions', decision = 'revisions', decided_on = ethics_today(), clock_stopped_on = ethics_today(), conditions = $2, letter_sent_on = null where id = $1 returning *", [a.id, text]);
      return note(r, 'The clock stops until the researcher responds (resubmit). Send the letter: draft-decision-letter.');
    }
    if (decision === 'declined') {
      [r] = await db.query("update applications set status = 'declined', decision = 'declined', decided_on = ethics_today(), conditions = $2, letter_sent_on = null where id = $1 returning *", [a.id, text]);
      return note(r, 'Give the reasons in the letter: draft-decision-letter.');
    }
    const expires = await plusMonths(db, 12 * p.approval_years, now);
    const report = await plusMonths(db, p.report_interval_months, now);
    const due = decision === 'approved with conditions' ? (opts.due ? date(opts.due) : await plusDays(db, 30)) : null;
    [r] = await db.query(`update applications set status = 'approved', decision = $2, decided_on = ethics_today(), approved_on = ethics_today(), expires_on = $3,
      next_report_due = $4, conditions = $5, conditions_due_on = $6, conditions_met_on = null, letter_sent_on = null where id = $1 returning *`, [a.id, decision, expires, report, text, due]);
    return note(r, `Approved to ${expires}; first progress report due ${report}.`, due ? `Conditions due ${due}.` : '', `Letter due by ${await plusDays(db, p.letter_days)}: draft-decision-letter.`);
  }
  if (cmd === 'letter') {
    const a = await app(db, args[0]);
    if (!a.decided_on) throw Error(`${a.name} has no decision yet`);
    return db.query('update applications set letter_sent_on = ethics_today() where id = $1 returning *', [a.id]);
  }
  if (cmd === 'resubmit') {
    const a = await app(db, args[0]);
    if (a.status !== 'revisions') throw Error(`${a.name} is ${a.status}, not waiting on revisions`);
    const [r] = await db.query(`update applications set status = 'in review', clock_stop_days = clock_stop_days + (ethics_today() - clock_stopped_on), clock_stopped_on = null,
      decision = null, decided_on = null, meeting_id = null, letter_sent_on = null where id = $1 returning *`, [a.id]);
    await db.query('update reviews set returned_on = null, recommendation = null, due_on = $2 where application_id = $1 and conflict is null', [a.id, await plusDays(db, p.review_days)]);
    return note(r, `Clock restarted. The same reviewers look at the response by ${await plusDays(db, p.review_days)}.`, a.pathway === 'full' ? 'Put it on a meeting, or let the chair decide it out of session if your terms allow.' : '');
  }
  if (cmd === 'conditions-met') {
    const a = await app(db, args[0]);
    if (a.decision !== 'approved with conditions') throw Error(`${a.name} has no conditions`);
    return db.query('update applications set conditions_met_on = ethics_today() where id = $1 returning *', [a.id]);
  }
  if (cmd === 'amend') {
    const a = await app(db, args[0]);
    if (!['approved', 'suspended'].includes(a.status)) throw Error(`${a.name} is ${a.status}; amendments are to approved research`);
    if (!args[1]) throw Error('amend <application> "<what changes>"');
    const [r] = await db.query('insert into amendments (name, application_id, summary) values ($1, $2, $3) returning *', [await nextName(db, 'amendments', 'AMD-', 4), a.id, args.slice(1).join(' ')]);
    return note({ ...r, application: a.name }, `Decide by ${await plusDays(db, p.amendment_days)}.`);
  }
  if (cmd === 'decide-amendment') {
    const x = await resolve(db, 'amendments', args[0]);
    if (!['approved', 'declined', 'withdrawn'].includes(args[1])) throw Error('decide-amendment <AMD-0001> <approved|declined|withdrawn>');
    if (x.decided_on) throw Error(`${x.name} was decided on ${day(x.decided_on)}`);
    return db.query('update amendments set decided_on = ethics_today(), outcome = $2 where id = $1 returning *', [x.id, args[1]]);
  }
  if (cmd === 'report') {
    const a = await app(db, args[0]);
    const kind = args[1];
    if (!['progress', 'final'].includes(kind)) throw Error('report <application> <progress|final> ["summary"] [--participants= --animals= --secure=yes|no]');
    if (!['approved', 'suspended'].includes(a.status)) throw Error(`${a.name} is ${a.status}; reports are on approved research`);
    const animals = opts.animals != null ? count(opts.animals, 'animals used') : null;
    const secure = opts.secure == null ? null : /^(yes|y|true)$/i.test(opts.secure);
    const [r] = await db.query('insert into reports (application_id, kind, participants, animals_used, records_secure, summary) values ($1, $2, $3, $4, $5, $6) returning *',
      [a.id, kind, opts.participants != null ? count(opts.participants, 'participants') : null, animals, secure, args.slice(2).join(' ') || null]);
    const notes = [];
    if (secure === false) notes.push('Records are not held securely: follow up before accepting the report.');
    if (a.animals_approved != null) {
      const used = Number(a.animals_used) + (animals || 0);
      if (used > a.animals_approved) notes.push(`Animals used: ${used} against ${a.animals_approved} approved. Ask the investigator to explain and the committee to consider it.`);
    }
    if (kind === 'final') {
      await db.query("update applications set final_report_on = ethics_today(), status = 'closed', closed_on = ethics_today(), next_report_due = null where id = $1", [a.id]);
      return note({ ...r, application: a.name, status: 'closed' }, ...notes);
    }
    const next = await plusMonths(db, p.report_interval_months, now);
    await db.query('update applications set next_report_due = $2 where id = $1', [a.id, next]);
    return note({ ...r, application: a.name, next_report_due: next }, ...notes);
  }
  if (cmd === 'event') {
    const a = await app(db, args[0]);
    const [, kind, occurred] = args;
    if (!EVENT_KINDS.includes(kind) || !occurred || !args[3]) throw Error(`event <application> <${EVENT_KINDS.join('|')}> <occurred YYYY-MM-DD> "<what happened>"`);
    date(occurred);
    if (occurred > now) throw Error('The event date is in the future');
    const [r] = await db.query('insert into events (name, application_id, kind, occurred_on, summary) values ($1, $2, $3, $4, $5) returning *', [await nextName(db, 'events', 'EV-', 4), a.id, kind, occurred, args.slice(3).join(' ')]);
    const late = (await db.query('select ethics_today() - $1::date as n', [occurred]))[0].n;
    return note({ ...r, application: a.name }, ['serious adverse event', 'unexpected death'].includes(kind) && late > p.safety_report_days ? `Reported ${late} days after it happened; your rule is ${p.safety_report_days}.` : '', ['serious adverse event', 'unexpected death'].includes(kind) ? 'Tell the chair today.' : '');
  }
  if (cmd === 'close-event') {
    const e = await resolve(db, 'events', args[0]);
    if (!args[1]) throw Error('close-event <EV-0001> "<the action taken>"');
    return db.query('update events set closed_on = ethics_today(), action = $2 where id = $1 returning *', [e.id, args.slice(1).join(' ')]);
  }
  if (cmd === 'suspend' || cmd === 'withdraw') {
    const a = await app(db, args[0]);
    const why = args.slice(1).join(' ');
    if (!why) throw Error(`${cmd} <application> "<reason>"`);
    if (cmd === 'suspend' && a.status !== 'approved') throw Error(`${a.name} is ${a.status}; only approved research is suspended`);
    if (cmd === 'withdraw' && !['submitted', 'in review', 'revisions'].includes(a.status)) throw Error(`${a.name} is ${a.status}; only an application not yet decided is withdrawn`);
    const [r] = await db.query('update applications set status = $2 where id = $1 returning *', [a.id, cmd === 'suspend' ? 'suspended' : 'withdrawn']);
    await db.query('insert into activity (application_id, note) values ($1, $2)', [a.id, `${cmd === 'suspend' ? 'Suspended' : 'Withdrawn'}: ${why}`]);
    return [r];
  }
  if (cmd === 'log') {
    const a = await app(db, args[0]);
    if (!args[1]) throw Error('log <application> "<note>"');
    return db.query('insert into activity (application_id, note) values ($1, $2) returning *', [a.id, args.slice(1).join(' ')]);
  }
  if (cmd === 'add' || cmd === 'set') return write(db, cmd, args);
  throw Error(`Unknown command "${cmd}". Run help.`);
}

// ------------------------------------------------------------------ add and set

async function write(db, cmd, args) {
  const [type, ...rest] = args;
  if (!fields[type]) throw Error('Writable types: ' + Object.keys(fields).join(', '));
  if (cmd === 'add' && type === 'applications') throw Error('Applications start with submit, not add');
  const record = cmd === 'set' ? (type === 'office_profile' ? await profile(db) : await resolve(db, type, rest.shift())) : null;
  let value;
  try { value = JSON.parse(rest.join(' ')); } catch { throw Error('Supply one JSON object of field values'); }
  if (!value || Array.isArray(value) || typeof value !== 'object' || !Object.keys(value).length) throw Error('Supply a non-empty JSON object');
  for (const k of Object.keys(value)) {
    if (!fields[type].includes(k)) throw Error(`Field ${k} is not writable on ${type}. Writable: ${fields[type].join(', ')}`);
    if ((k.endsWith('_on') || k.endsWith('_until') || k.endsWith('_due')) && value[k] !== null) date(value[k]);
  }
  if (type === 'members' && 'committee' in value) {
    value.committee_id = (await resolve(db, 'committees', value.committee)).id;
    delete value.committee;
  }
  if (type === 'members' && cmd === 'add' && !value.committee_id) throw Error('A member needs a committee: {"name":"...","committee":"HREC","category":"lay"}');
  const keys = Object.keys(value), vals = Object.values(value);
  if (record) return db.query(`update ${type} set ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')} where id = $${vals.length + 1} returning *`, [...vals, record.id]);
  return db.query(`insert into ${type} (${keys.join(', ')}) values (${vals.map((_, i) => '$' + (i + 1)).join(', ')}) returning *`, vals);
}

// ------------------------------------------------------------------ drafts

async function draft(db, cmd, args) {
  const p = await profile(db);
  const sign = `\n\nKind regards,\nResearch Ethics Office\n${p.name}\n\nDraft. A person reviews and sends it.`;
  if (cmd === 'draft-decision-letter') {
    const a = await app(db, args[0]);
    if (!a.decision) throw Error(`${a.name} has no decision yet`);
    const head = `Subject: Ethics decision: ${a.name}, ${a.title}\n\nDear ${a.investigator},\n\n${a.committee} considered your application ${a.name}, "${a.title}"${a.meeting ? ` at its meeting on ${day(a.meets_on)}` : ''}.`;
    const record = `\n\nRecord it once sent: letter ${a.name}`;
    if (a.decision === 'revisions') return draftFile('decision', a.id, `${head}\n\nThe committee needs more information before it can decide. Please respond to each point:\n\n${a.conditions}\n\nThe review clock is stopped until we receive your response. Send the revised documents with changes marked.${sign}${record}`);
    if (a.decision === 'declined') return draftFile('decision', a.id, `${head}\n\nThe committee did not approve the application. Its reasons:\n\n${a.conditions || '[reasons from the minutes]'}\n\nYou may submit a new application that addresses these reasons, or ask for the decision to be reconsidered under the committee's complaints and review process.${sign}${record}`);
    const reports = `Approval runs from ${day(a.approved_on)} to ${day(a.expires_on)}. Your first progress report is due by ${day(a.next_report_due)}, then at least once a year, with a final report when the research ends. Report any serious adverse event${a.kind === 'animal' ? ' or unexpected death' : ''} within ${plural(p.safety_report_days, 'day')}, and any change to the research as an amendment before it starts.`;
    const animals = a.animals_approved != null ? `\n\nApproved: ${a.animals_approved} ${a.species || 'animals'}. Use no more without an approved amendment.` : '';
    const cond = a.decision === 'approved with conditions' ? `\n\nThe approval is subject to these conditions, to be met by ${day(a.conditions_due_on)}:\n\n${a.conditions}` : '';
    return draftFile('decision', a.id, `${head}\n\nThe committee approved the research.${cond}${animals}\n\n${reports}${sign}${record}`);
  }
  if (cmd === 'draft-report-reminder') {
    const a = await app(db, args[0]);
    if (!a.next_report_due && a.status !== 'approved') throw Error(`${a.name} has no report due`);
    const expired = a.expires_on && day(a.expires_on) < (await today(db));
    const kind = expired ? 'final report' : 'annual progress report';
    return draftFile('report-reminder', a.id, `Subject: ${kind[0].toUpperCase() + kind.slice(1)} due: ${a.name}\n\nDear ${a.investigator},\n\nYour ${kind} for ${a.name}, "${a.title}", ${expired ? `is due: the approval ended on ${day(a.expires_on)}` : `is due by ${day(a.next_report_due)}`}.\n\nPlease tell us: progress to date (or the outcome, if the research has finished), the number of ${a.kind === 'animal' ? 'animals used' : 'participants'}, any changes or problems, and how the records are being kept and kept secure.${expired ? '\n\nIf the research is still running, it needs a current approval: apply for an extension as an amendment.' : ''}${sign}\n\nRecord it once sent: log ${a.name} "Report reminder sent"`);
  }
  if (cmd === 'draft-reviewer-reminder') {
    const m = await resolve(db, 'members', args[0]);
    const open = await db.query(`select a.name, a.title, r.due_on from reviews r join applications a on a.id = r.application_id
      where r.member_id = $1 and r.returned_on is null and r.conflict is null and a.status in ('submitted', 'in review') order by r.due_on`, [m.id]);
    if (!open.length) throw Error(`${m.name} has no reviews open`);
    return draftFile('reviewer-reminder', m.id, `Subject: Reviews due\n\nDear ${first(m.name)},\n\nThank you for reviewing for the committee. These are with you:\n\n${open.map((o) => `- ${o.name}, "${o.title}": due ${day(o.due_on)}`).join('\n')}\n\nIf you cannot get to one, tell us today and we will reassign it. If you have an interest in any of these, please declare it.${sign}`);
  }
  if (cmd === 'draft-agenda') {
    const mt = await resolve(db, 'meetings', args[0]);
    const items = await db.query('select name, title, pathway, investigator, reviewers, reviews_out from application_detail where meeting_id = $1 order by name', [mt.id]);
    const amends = await db.query(`select x.name, a.name as application, x.summary from amendments x join applications a on a.id = x.application_id where x.decided_on is null and a.committee_id = $1 order by x.submitted_on`, [mt.committee_id]);
    const events = await db.query(`select e.name, a.name as application, e.kind, e.summary from events e join applications a on a.id = e.application_id where e.closed_on is null and a.committee_id = $1 order by e.occurred_on`, [mt.committee_id]);
    const [prev] = await db.query('select name from meetings where committee_id = $1 and held and meets_on < $2 order by meets_on desc limit 1', [mt.committee_id, mt.meets_on]);
    return draftFile('agenda', mt.id, `Agenda: ${mt.name}\nMeets: ${day(mt.meets_on)}. Agenda closed: ${day(mt.closes_on)}.\n\n1. Apologies and quorum\n2. Declarations of interest on any item below\n3. Minutes of ${prev ? prev.name : 'the last meeting'} for confirmation\n4. New applications\n${items.length ? items.map((i) => `   - ${i.name}: ${i.title} (${i.investigator}, ${i.pathway}${i.reviews_out ? `, ${i.reviews_out} review${i.reviews_out === 1 ? '' : 's'} still out` : ''})`).join('\n') : '   - none'}\n5. Amendments waiting\n${amends.length ? amends.map((x) => `   - ${x.name} on ${x.application}: ${x.summary}`).join('\n') : '   - none'}\n6. Safety and conduct reports open\n${events.length ? events.map((e) => `   - ${e.name} on ${e.application} (${e.kind}): ${e.summary}`).join('\n') : '   - none'}\n7. Other business\n\nDraft for the chair. Nothing is sent.`);
  }
  throw Error(`Unknown command "${cmd}". Run help.`);
}

// ------------------------------------------------------------------ attention and compliance

export async function attention(db) {
  const p = await profile(db);
  const out = [];
  const add = (who, issue, detail) => out.push({ who, issue, detail });
  for (const r of await run(db, 'queue')) {
    if (['check it, overdue', 'chase the researcher', 'past the decision target', 'no reviewers', 'needs a meeting'].includes(r.stage)) add(r.application, r.stage, `${r.investigator}, ${r.committee}${r.clock_days != null ? `, ${r.clock_days} days on the clock` : ''}${r.with_researcher_days ? `, ${r.with_researcher_days} days with the researcher` : ''}`);
  }
  for (const r of (await run(db, 'reviews')).filter((x) => x.days_late > 0)) add(r.reviewer, 'review late', `${r.application}, ${plural(r.days_late, 'day')} past ${day(r.due_on)}`);
  for (const r of await db.query(`select a.name, a.decided_on, a.decision from applications a cross join office_profile p where a.decided_on is not null and a.letter_sent_on is null and a.decided_on <= ethics_today() - p.letter_days`)) add(r.name, 'decision letter not sent', `${r.decision} on ${day(r.decided_on)}`);
  for (const r of (await run(db, 'conditions')).filter((x) => x.days_late > 0)) add(r.application, 'conditions not met', `due ${day(r.conditions_due_on)}: ${r.conditions}`);
  for (const r of await run(db, 'reports-due')) add(r.application, r.stage === 'overdue' ? 'progress report overdue' : 'progress report due soon', `${r.investigator}, due ${day(r.next_report_due)}`);
  for (const r of await run(db, 'expiring')) add(r.application, r.stage === 'expiring' ? 'approval expiring' : 'approval expired, study still open', `${r.investigator}, ${day(r.expires_on)}`);
  for (const r of (await run(db, 'final-reports')).filter((x) => x.days_late > 0)) add(r.application, 'final report overdue', `${r.investigator}, due ${day(r.final_due)}`);
  for (const r of (await run(db, 'amendments')).filter((x) => x.days_open > p.amendment_days)) add(r.application, 'amendment waiting', `${r.name}: ${r.summary}, ${r.days_open} days`);
  for (const r of (await run(db, 'events')).filter((x) => !x.closed_on)) add(r.application, `${r.kind} open`, `${r.name}, ${day(r.occurred_on)}: ${r.summary}`);
  for (const r of (await run(db, 'animals')).filter((x) => x.remaining < 0)) add(r.application, 'animals over the approved number', `${r.animals_used} used of ${r.animals_approved} ${r.species}`);
  for (const c of await db.query('select * from committees where active order by name')) for (const g of await membershipGaps(db, c, p.jurisdiction)) add(c.name, 'membership gap', g);
  for (const r of await db.query('select m.name, c.name as committee, m.term_ends_on from members m join committees c on c.id = m.committee_id where m.active and m.term_ends_on < ethics_today() order by m.term_ends_on')) add(r.name, 'term ended', `${r.committee}, ${day(r.term_ends_on)}: reappoint or retire`);
  for (const r of await db.query('select m.name, m.meets_on from meetings m cross join office_profile p where m.held and m.minutes_confirmed_on is null and m.meets_on <= ethics_today() - p.minutes_confirm_days order by m.meets_on')) add(r.name, 'minutes not confirmed', `met ${day(r.meets_on)}`);
  return out;
}

const NS = 'https://www.nhmrc.gov.au/about-us/publications/national-statement-ethical-conduct-human-research-2025';
const CODE = 'https://www.nhmrc.gov.au/about-us/publications/australian-code-care-and-use-animals-scientific-purposes';
const AWA = 'https://www.legislation.govt.nz/act/public/1999/0142/latest/whole.html';
const NEAC = 'https://neac.health.govt.nz/national-ethical-standards/';
const TERMS = 'docs/compliance.md';

export async function compliance(db) {
  const p = await profile(db);
  const nz = p.jurisdiction === 'NZ';
  const human = nz ? NEAC : NS;
  const rules = [
    ['ANNUAL-REPORT', `Researchers report on approved research at least once a year: progress, and how records are kept secure (${nz ? 'National Ethical Standards' : 'National Statement, Section 5'})`, human,
      "select name, 'report due ' || next_report_due || ', last received ' || coalesce(last_report_on::text, 'never') as detail from approvals where days_to_expiry >= 0 and next_report_due < ethics_today()"],
    ['FINAL-REPORT', `A final report when the research ends, within ${p.final_report_days} days of the approval ending (your terms)`, human,
      `select name, 'approval ended ' || expires_on || ', no final report' as detail from application_detail where status in ('approved', 'suspended') and final_report_on is null and expires_on + ${Number(p.final_report_days)} < ethics_today()`],
    ['APPROVAL-CURRENT', 'Research runs only under a current approval; an approval that has ended is extended by amendment or the study is closed', human,
      "select name, 'approval ended ' || expires_on || ', still open' as detail from applications where status = 'approved' and expires_on < ethics_today()"],
    ['CONFLICT-OF-INTEREST', 'A member with an interest in an application declares it and takes no part in reviewing or deciding it', human,
      "select a.name, m.name || ' declared \"' || r.conflict || '\" and returned a review' as detail from reviews r join applications a on a.id = r.application_id join members m on m.id = r.member_id where r.conflict is not null and r.returned_on is not null"],
    ['DECISION-IN-WRITING', `The decision and any conditions are sent to the researcher in writing, within ${p.letter_days} days (your target)`, human,
      `select name, decision || ' on ' || decided_on || ', no letter sent' as detail from applications where decided_on is not null and letter_sent_on is null and decided_on <= ethics_today() - ${Number(p.letter_days)}`],
    ['CONDITIONS-MET', 'Conditions of approval are met by the date set before the research relies on them', TERMS,
      "select name, 'conditions due ' || conditions_due_on || ': ' || conditions as detail from applications where decision = 'approved with conditions' and status = 'approved' and conditions_met_on is null and conditions_due_on < ethics_today()"],
    ['SAFETY-REPORTING', `A serious adverse event or unexpected death is reported to the committee within ${p.safety_report_days} days (your rule; set it to your sponsor's and regulator's timelines)`, TERMS,
      `select a.name, e.name || ' ' || e.kind || ' on ' || e.occurred_on || ', reported ' || e.reported_on || ' (' || (e.reported_on - e.occurred_on) || ' days)' as detail
       from events e join applications a on a.id = e.application_id where e.kind in ${SERIOUS} and e.reported_on - e.occurred_on > ${Number(p.safety_report_days)}`],
    ['MINUTES', `Every meeting is minuted and the minutes confirmed, within ${p.minutes_confirm_days} days (your terms of reference)`, human,
      `select name, 'met ' || meets_on || ', minutes not confirmed' as detail from meetings where held and minutes_confirmed_on is null and meets_on <= ethics_today() - ${Number(p.minutes_confirm_days)}`],
    ['CONFIDENTIALITY', 'Every member has a signed confidentiality undertaking on file (your terms of reference)', TERMS,
      "select m.name, c.name || ' member, no undertaking on file' as detail from members m join committees c on c.id = m.committee_id where m.active and m.confidentiality_signed_on is null"],
    ['ANIMAL-NUMBERS', `Animals are used only as approved; more needs an approved amendment first (${nz ? 'the code of ethical conduct' : 'Australian Code'})`, nz ? AWA : CODE,
      "select name, animals_used || ' ' || coalesce(species, 'animals') || ' used, ' || animals_approved || ' approved' as detail from approvals where animals_approved is not null and animals_used > animals_approved"],
  ];
  const out = [];
  for (const [rule, requirement, source, sql] of rules) for (const r of await db.query(sql)) out.push({ rule, record: r.name, detail: r.detail, requirement, source });

  // Membership: minimum categories per committee.
  for (const c of await db.query('select * from committees where active order by name')) {
    const gaps = await membershipGaps(db, c, p.jurisdiction);
    const [rule, requirement, source] = c.kind === 'human'
      ? ['HREC-MEMBERSHIP', nz ? 'Committee membership meets the minimums in its terms of reference' : 'An HREC has at least eight members: a chair, two lay people, someone in professional care, counselling or treatment, someone in pastoral care, a lawyer and two with current research experience (National Statement, Section 5)', human]
      : nz ? ['AEC-MEMBERSHIP-NZ', 'An animal ethics committee has at least four members, including a vet nominated by the NZVA, a nominee of an approved animal welfare organisation and a lay member nominated by a council (Animal Welfare Act 1999, section 100)', AWA]
        : ['AEC-MEMBERSHIP', 'An AEC has a chair and at least one member in each of Categories A, B, C and D, with C and D at least a third of the members (Australian Code)', CODE];
    for (const g of gaps) out.push({ rule, record: c.name, detail: g, requirement, source });
  }
  // Quorum at every held meeting where something was decided.
  for (const m of await db.query("select distinct mt.id, mt.name from meetings mt join applications a on a.meeting_id = mt.id where mt.held and a.decided_on is not null and a.decided_on >= mt.meets_on order by mt.name")) {
    const q = await meetingQuorum(db, m.id, p.jurisdiction);
    if (!q.ok) {
      const [k] = await db.query('select c.kind from meetings mt join committees c on c.id = mt.committee_id where mt.id = $1', [m.id]);
      out.push(k.kind === 'animal' && !nz
        ? { rule: 'AEC-QUORUM', record: m.name, detail: `decisions made with ${q.why}`, requirement: 'An AEC decides only when a quorum with at least one member from each of Categories A, B, C and D is present (Australian Code)', source: CODE }
        : { rule: 'QUORUM', record: m.name, detail: `decisions made with ${q.why}`, requirement: 'The committee decides only with a quorum present (your terms of reference)', source: TERMS });
    }
  }
  if (nz && (await db.query("select 1 from committees where kind = 'animal' and active")).length && (!p.code_approved_until || day(p.code_approved_until) < (await today(db)))) {
    out.push({ rule: 'NZ-CODE-OF-CONDUCT', record: p.name, detail: p.code_approved_until ? `code approval ended ${day(p.code_approved_until)}` : 'no code approval date recorded', requirement: 'Research using animals runs only under a code of ethical conduct approved by the Director-General (Animal Welfare Act 1999, Part 6)', source: AWA });
  }
  return out;
}
