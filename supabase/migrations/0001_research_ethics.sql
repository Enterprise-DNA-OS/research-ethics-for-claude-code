-- Research Ethics for Claude Code: the schema.
-- Plain Postgres. Runs on any Postgres 13+ and on embedded PGlite. No extensions.
-- Dates are the ethics office's own calendar dates (ethics_today()), not UTC.

create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- One row: the institution, its time zone and the targets and periods it works to.
-- See docs/compliance.md for where each default comes from.
create table office_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  singleton boolean not null default true unique check (singleton),
  jurisdiction text not null default 'AU' check (jurisdiction in ('AU', 'NZ')),
  state text,
  timezone text not null default 'Australia/Sydney',
  decision_days integer not null default 60 check (decision_days > 0),          -- target: valid submission to decision, clock stopped while with the researcher
  validate_days integer not null default 5 check (validate_days > 0),           -- target: submission checked complete or returned
  review_days integer not null default 14 check (review_days > 0),              -- reviewer has this long to return comments
  revisions_chase_days integer not null default 21 check (revisions_chase_days > 0),
  letter_days integer not null default 5 check (letter_days > 0),               -- decision letter goes out within
  report_reminder_days integer not null default 30 check (report_reminder_days >= 0),
  report_interval_months integer not null default 12 check (report_interval_months between 1 and 12),
  final_report_days integer not null default 90 check (final_report_days > 0),  -- final report due this long after approval ends
  approval_years integer not null default 5 check (approval_years > 0),
  safety_report_days integer not null default 3 check (safety_report_days >= 0),
  minutes_confirm_days integer not null default 45 check (minutes_confirm_days > 0),
  amendment_days integer not null default 30 check (amendment_days > 0),
  code_approved_until date,                                                     -- NZ: the MPI-approved code of ethical conduct for animal use
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger office_profile_updated before update on office_profile for each row execute function touch_updated_at();

-- The office's own clock. The database may run in UTC; the office runs on local dates.
create function ethics_today() returns date language sql stable as $$
  select (now() at time zone coalesce((select timezone from office_profile limit 1), 'UTC'))::date
$$;

-- A human research ethics committee (HREC, HDEC) or an animal ethics committee (AEC).
create table committees (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('human', 'animal')),
  registration text,                       -- e.g. the NHMRC registration code
  quorum integer not null default 5 check (quorum > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger committees_updated before update on committees for each row execute function touch_updated_at();

-- Members. category is the membership category the rules count:
-- human: chair, lay, care, pastoral, lawyer, researcher
-- animal (AU code): A (vet), B (researcher), C (animal welfare), D (independent lay), chair
-- animal (NZ Act s100): senior, vet, welfare, lay, chair
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  committee_id uuid not null references committees(id),
  category text not null check (category in ('chair', 'lay', 'care', 'pastoral', 'lawyer', 'researcher', 'A', 'B', 'C', 'D', 'senior', 'vet', 'welfare', 'other')),
  external boolean not null default false, -- not employed by the institution
  gender text,
  appointed_on date,
  term_ends_on date,
  confidentiality_signed_on date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (committee_id, name)
);
create trigger members_updated before update on members for each row execute function touch_updated_at();

create table meetings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,               -- e.g. HREC 2026-11
  committee_id uuid not null references committees(id),
  meets_on date not null,
  closes_on date not null,                 -- agenda closes for new submissions
  held boolean not null default false,
  minutes_confirmed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_on <= meets_on)
);
create trigger meetings_updated before update on meetings for each row execute function touch_updated_at();

create table attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id),
  member_id uuid not null references members(id),
  present boolean not null default true,
  created_at timestamptz not null default now(),
  unique (meeting_id, member_id)
);

-- An ethics application: one research project under one committee.
create table applications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,               -- the reference, e.g. HREC-2026-040
  title text not null,
  committee_id uuid not null references committees(id),
  pathway text not null default 'full' check (pathway in ('full', 'low risk', 'exempt')),
  investigator text not null,              -- chief or principal investigator
  investigator_email text,
  department text,
  sites integer not null default 1 check (sites > 0),
  student boolean not null default false,
  species text,                            -- animal applications
  animals_approved integer check (animals_approved >= 0),
  status text not null default 'submitted' check (status in ('submitted', 'in review', 'revisions', 'approved', 'declined', 'withdrawn', 'suspended', 'closed')),
  submitted_on date not null default ethics_today(),
  valid_on date,                           -- checked complete; the decision clock starts
  meeting_id uuid references meetings(id),
  clock_stopped_on date,                   -- with the researcher since
  clock_stop_days integer not null default 0 check (clock_stop_days >= 0),
  decided_on date,
  decision text check (decision in ('approved', 'approved with conditions', 'revisions', 'declined')),
  letter_sent_on date,
  conditions text,
  conditions_due_on date,
  conditions_met_on date,
  approved_on date,
  expires_on date,
  next_report_due date,
  final_report_on date,
  closed_on date,
  external_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger applications_updated before update on applications for each row execute function touch_updated_at();

create table reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id),
  member_id uuid not null references members(id),
  assigned_on date not null default ethics_today(),
  due_on date not null,
  returned_on date,
  recommendation text check (recommendation in ('approve', 'approve with conditions', 'revisions', 'decline')),
  comments text,
  conflict text,                           -- declared conflict of interest; a conflicted reviewer does not review
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, member_id)
);
create trigger reviews_updated before update on reviews for each row execute function touch_updated_at();

create table amendments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,               -- AMD-0001
  application_id uuid not null references applications(id),
  summary text not null,
  submitted_on date not null default ethics_today(),
  decided_on date,
  outcome text check (outcome in ('approved', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger amendments_updated before update on amendments for each row execute function touch_updated_at();

-- Progress (annual) and final reports from the researcher.
create table reports (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id),
  kind text not null check (kind in ('progress', 'final')),
  received_on date not null default ethics_today(),
  participants integer check (participants >= 0),
  animals_used integer check (animals_used >= 0),
  records_secure boolean,
  summary text,
  created_at timestamptz not null default now()
);

-- Safety and conduct reports: serious adverse events, deviations, complaints, unexpected deaths.
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,               -- EV-0001
  application_id uuid not null references applications(id),
  kind text not null check (kind in ('serious adverse event', 'protocol deviation', 'complaint', 'breach', 'unexpected death')),
  occurred_on date not null,
  reported_on date not null default ethics_today(),
  summary text not null,
  action text,
  closed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger events_updated before update on events for each row execute function touch_updated_at();

create table activity (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  happened_on date not null default ethics_today(),
  note text not null,
  created_at timestamptz not null default now()
);

create table audit (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  record_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Every application with its committee, the decision clock and its reporting position.
create view application_detail as
select a.*, c.name as committee, c.kind,
  m.name as meeting, m.meets_on,
  case when a.valid_on is null then null
       else coalesce(a.decided_on, ethics_today()) - a.valid_on - a.clock_stop_days
            - case when a.clock_stopped_on is not null and a.decided_on is null then ethics_today() - a.clock_stopped_on else 0 end
  end as clock_days,
  case when a.clock_stopped_on is not null then ethics_today() - a.clock_stopped_on end as with_researcher_days,
  (select count(*)::int from reviews r where r.application_id = a.id and r.conflict is null) as reviewers,
  (select count(*)::int from reviews r where r.application_id = a.id and r.conflict is null and r.returned_on is null) as reviews_out,
  (select max(received_on) from reports r where r.application_id = a.id) as last_report_on,
  (select coalesce(sum(animals_used), 0)::int from reports r where r.application_id = a.id) as animals_used
from applications a
join committees c on c.id = a.committee_id
left join meetings m on m.id = a.meeting_id;

-- Approved research that is running: when it expires and when the next report is due.
create view approvals as
select d.name, d.title, d.committee, d.investigator, d.approved_on, d.expires_on, d.next_report_due, d.last_report_on,
  d.expires_on - ethics_today() as days_to_expiry,
  d.next_report_due - ethics_today() as days_to_report,
  d.species, d.animals_approved, d.animals_used, d.id
from application_detail d
where d.status in ('approved', 'suspended');

-- Who sits on each committee, counted by category.
create view membership as
select c.name as committee, c.kind, m.category, count(*) filter (where m.active)::int as members,
  count(*) filter (where m.active and m.external)::int as external,
  string_agg(m.name, ', ' order by m.name) filter (where m.active) as names
from committees c join members m on m.committee_id = c.id
group by c.name, c.kind, m.category;

-- Each held meeting: who came, by category.
create view meeting_attendance as
select mt.id, mt.name, c.name as committee, c.kind, c.quorum, mt.meets_on, mt.held, mt.minutes_confirmed_on,
  count(*) filter (where at.present)::int as present,
  coalesce(string_agg(distinct m.category, ',' order by m.category) filter (where at.present), '') as categories
from meetings mt
join committees c on c.id = mt.committee_id
left join attendance at on at.meeting_id = mt.id
left join members m on m.id = at.member_id
group by mt.id, mt.name, c.name, c.kind, c.quorum, mt.meets_on, mt.held, mt.minutes_confirmed_on;
