-- Fictional demo ethics office. Every date is relative to today, so the attention commands always
-- have something to say: an annual report 40 days late, an approval that expired with the study
-- still running, a final report never sent, a submission nobody has checked, a reviewer two weeks
-- late, an application past the decision target, a researcher sitting on revisions, conditions not
-- met, a decision letter not sent, a serious adverse event reported late, a reviewer who declared a
-- conflict and reviewed anyway, an animal study over its approved numbers, an animal decision made
-- without an independent member present, a committee missing its pastoral care member, minutes
-- never confirmed and an amendment waiting a month.
-- Idempotent: fixed ids and on conflict do nothing.

insert into office_profile (id, name, jurisdiction, state, timezone)
values ('00000000-0000-4000-8000-000000000001', 'Southern Coast Research Institute', 'AU', 'NSW', 'Australia/Sydney')
on conflict do nothing;

insert into committees (id, name, kind, registration, quorum) values
('20000000-0000-4000-8000-000000000001', 'Southern Coast HREC', 'human', 'EC00999 (demo)', 5),
('20000000-0000-4000-8000-000000000002', 'Southern Coast AEC', 'animal', null, 4)
on conflict do nothing;

insert into members (id, name, email, committee_id, category, external, gender, appointed_on, term_ends_on, confidentiality_signed_on, active) values
('30000000-0000-4000-8000-000000000001', 'Dr Helen Park', 'helen.park@example.org', '20000000-0000-4000-8000-000000000001', 'chair', false, 'woman', ethics_today() - 1400, ethics_today() + 300, ethics_today() - 1400, true),
('30000000-0000-4000-8000-000000000002', 'Robert Nguyen', 'robert.nguyen@example.org', '20000000-0000-4000-8000-000000000001', 'lay', true, 'man', ethics_today() - 900, ethics_today() + 200, ethics_today() - 900, true),
('30000000-0000-4000-8000-000000000003', 'Margaret Ellis', 'margaret.ellis@example.org', '20000000-0000-4000-8000-000000000001', 'lay', true, 'woman', ethics_today() - 120, ethics_today() + 975, null, true),
('30000000-0000-4000-8000-000000000004', 'Sarah O''Brien', 'sarah.obrien@example.org', '20000000-0000-4000-8000-000000000001', 'care', false, 'woman', ethics_today() - 700, ethics_today() + 400, ethics_today() - 700, true),
('30000000-0000-4000-8000-000000000005', 'Andrew Kowalski', 'andrew.kowalski@example.org', '20000000-0000-4000-8000-000000000001', 'lawyer', true, 'man', ethics_today() - 1000, ethics_today() + 95, ethics_today() - 1000, true),
('30000000-0000-4000-8000-000000000006', 'Prof David Okafor', 'david.okafor@example.org', '20000000-0000-4000-8000-000000000001', 'researcher', false, 'man', ethics_today() - 1300, ethics_today() + 150, ethics_today() - 1300, true),
('30000000-0000-4000-8000-000000000007', 'Dr Priya Raman', 'priya.raman@example.org', '20000000-0000-4000-8000-000000000001', 'researcher', false, 'woman', ethics_today() - 500, ethics_today() + 600, ethics_today() - 500, true),
('30000000-0000-4000-8000-000000000008', 'Dr Tom Fletcher', 'tom.fletcher@example.org', '20000000-0000-4000-8000-000000000001', 'researcher', false, 'man', ethics_today() - 1105, ethics_today() - 10, ethics_today() - 1105, true),
('30000000-0000-4000-8000-000000000009', 'Rev Anne Walsh', 'anne.walsh@example.org', '20000000-0000-4000-8000-000000000001', 'pastoral', true, 'woman', ethics_today() - 1500, ethics_today() - 60, ethics_today() - 1500, false),
('30000000-0000-4000-8000-000000000011', 'Dr Kate Morrison', 'kate.morrison@example.org', '20000000-0000-4000-8000-000000000002', 'chair', false, 'woman', ethics_today() - 800, ethics_today() + 300, ethics_today() - 800, true),
('30000000-0000-4000-8000-000000000012', 'Dr Liam Hughes', 'liam.hughes@example.org', '20000000-0000-4000-8000-000000000002', 'A', true, 'man', ethics_today() - 600, ethics_today() + 500, ethics_today() - 600, true),
('30000000-0000-4000-8000-000000000013', 'Dr Mei Lin', 'mei.lin@example.org', '20000000-0000-4000-8000-000000000002', 'B', false, 'woman', ethics_today() - 600, ethics_today() + 500, ethics_today() - 600, true),
('30000000-0000-4000-8000-000000000014', 'Joanne Barker', 'joanne.barker@example.org', '20000000-0000-4000-8000-000000000002', 'C', true, 'woman', ethics_today() - 400, ethics_today() + 700, ethics_today() - 400, true),
('30000000-0000-4000-8000-000000000015', 'Peter Grant', 'peter.grant@example.org', '20000000-0000-4000-8000-000000000002', 'D', true, 'man', ethics_today() - 400, ethics_today() + 700, ethics_today() - 400, true),
('30000000-0000-4000-8000-000000000016', 'Dr Sam Ito', 'sam.ito@example.org', '20000000-0000-4000-8000-000000000002', 'B', false, 'man', ethics_today() - 300, ethics_today() + 800, ethics_today() - 300, true)
on conflict do nothing;

insert into meetings (id, name, committee_id, meets_on, closes_on, held, minutes_confirmed_on) values
('40000000-0000-4000-8000-000000000001', 'HREC ' || (ethics_today() - 84), '20000000-0000-4000-8000-000000000001', ethics_today() - 84, ethics_today() - 98, true, ethics_today() - 56),
('40000000-0000-4000-8000-000000000002', 'HREC ' || (ethics_today() - 56), '20000000-0000-4000-8000-000000000001', ethics_today() - 56, ethics_today() - 70, true, null),
('40000000-0000-4000-8000-000000000003', 'HREC ' || (ethics_today() - 28), '20000000-0000-4000-8000-000000000001', ethics_today() - 28, ethics_today() - 42, true, null),
('40000000-0000-4000-8000-000000000004', 'HREC ' || (ethics_today() + 9), '20000000-0000-4000-8000-000000000001', ethics_today() + 9, ethics_today() - 5, false, null),
('40000000-0000-4000-8000-000000000005', 'HREC ' || (ethics_today() + 37), '20000000-0000-4000-8000-000000000001', ethics_today() + 37, ethics_today() + 23, false, null),
('40000000-0000-4000-8000-000000000011', 'AEC ' || (ethics_today() - 21), '20000000-0000-4000-8000-000000000002', ethics_today() - 21, ethics_today() - 35, true, null),
('40000000-0000-4000-8000-000000000012', 'AEC ' || (ethics_today() + 16), '20000000-0000-4000-8000-000000000002', ethics_today() + 16, ethics_today() + 2, false, null)
on conflict do nothing;

insert into attendance (meeting_id, member_id, present)
select m.meeting::uuid, ('30000000-0000-4000-8000-0000000000' || m.member)::uuid, m.present
from (values
  ('40000000-0000-4000-8000-000000000001', '01', true), ('40000000-0000-4000-8000-000000000001', '02', true), ('40000000-0000-4000-8000-000000000001', '04', true),
  ('40000000-0000-4000-8000-000000000001', '05', true), ('40000000-0000-4000-8000-000000000001', '06', true), ('40000000-0000-4000-8000-000000000001', '09', true),
  ('40000000-0000-4000-8000-000000000002', '01', true), ('40000000-0000-4000-8000-000000000002', '03', true), ('40000000-0000-4000-8000-000000000002', '04', true),
  ('40000000-0000-4000-8000-000000000002', '06', true), ('40000000-0000-4000-8000-000000000002', '07', true), ('40000000-0000-4000-8000-000000000002', '05', false),
  ('40000000-0000-4000-8000-000000000003', '01', true), ('40000000-0000-4000-8000-000000000003', '02', true), ('40000000-0000-4000-8000-000000000003', '04', true),
  ('40000000-0000-4000-8000-000000000003', '05', true), ('40000000-0000-4000-8000-000000000003', '06', true), ('40000000-0000-4000-8000-000000000003', '07', true),
  ('40000000-0000-4000-8000-000000000011', '11', true), ('40000000-0000-4000-8000-000000000011', '12', true), ('40000000-0000-4000-8000-000000000011', '13', true),
  ('40000000-0000-4000-8000-000000000011', '14', true), ('40000000-0000-4000-8000-000000000011', '15', false)
) as m(meeting, member, present)
on conflict do nothing;

insert into applications (id, name, title, committee_id, pathway, investigator, investigator_email, department, sites, student, species, animals_approved,
  status, submitted_on, valid_on, meeting_id, clock_stopped_on, clock_stop_days, decided_on, decision, letter_sent_on, conditions, conditions_due_on, conditions_met_on,
  approved_on, expires_on, next_report_due, final_report_on, closed_on) values
('50000000-0000-4000-8000-000000000001', 'HREC-2024-018', 'Sleep and shift work in emergency nurses', '20000000-0000-4000-8000-000000000001', 'full', 'Dr Fiona Grant', 'fiona.grant@example.org', 'Nursing', 2, false, null, null,
  'approved', ethics_today() - 760, ethics_today() - 755, null, null, 12, ethics_today() - 700, 'approved', ethics_today() - 698, null, null, null,
  ethics_today() - 700, ethics_today() + 1125, ethics_today() - 40, null, null),
('50000000-0000-4000-8000-000000000002', 'HREC-2021-007', 'Long-term outcomes after knee replacement', '20000000-0000-4000-8000-000000000001', 'full', 'Prof Alan Wright', 'alan.wright@example.org', 'Orthopaedics', 3, false, null, null,
  'approved', ethics_today() - 1900, ethics_today() - 1895, null, null, 0, ethics_today() - 1845, 'approved', ethics_today() - 1843, null, null, null,
  ethics_today() - 1845, ethics_today() - 20, ethics_today() + 65, null, null),
('50000000-0000-4000-8000-000000000003', 'HREC-2025-031', 'Telehealth follow-up for heart failure', '20000000-0000-4000-8000-000000000001', 'full', 'Dr Ben Adeyemi', 'ben.adeyemi@example.org', 'Cardiology', 1, false, null, null,
  'approved', ethics_today() - 400, ethics_today() - 396, null, null, 9, ethics_today() - 345, 'approved', ethics_today() - 344, null, null, null,
  ethics_today() - 345, ethics_today() + 1480, ethics_today() + 20, null, null),
('50000000-0000-4000-8000-000000000004', 'HREC-2026-040', 'A vaping cessation app for young adults', '20000000-0000-4000-8000-000000000001', 'full', 'Dr Chloe Bennett', 'chloe.bennett@example.org', 'Public Health', 1, false, null, null,
  'in review', ethics_today() - 25, ethics_today() - 22, '40000000-0000-4000-8000-000000000004', null, 0, null, null, null, null, null, null,
  null, null, null, null, null),
('50000000-0000-4000-8000-000000000005', 'HREC-2026-041', 'Community pharmacists and deprescribing in aged care', '20000000-0000-4000-8000-000000000001', 'low risk', 'Dr Hannah Moore', 'hannah.moore@example.org', 'Pharmacy', 1, false, null, null,
  'submitted', ethics_today() - 8, null, null, null, 0, null, null, null, null, null, null,
  null, null, null, null, null),
('50000000-0000-4000-8000-000000000006', 'HREC-2026-036', 'Gut microbiome in preterm infants', '20000000-0000-4000-8000-000000000001', 'full', 'Prof Rachel Stone', 'rachel.stone@example.org', 'Neonatology', 2, false, null, null,
  'in review', ethics_today() - 80, ethics_today() - 78, '40000000-0000-4000-8000-000000000004', null, 10, null, null, null, null, null, null,
  null, null, null, null, null),
('50000000-0000-4000-8000-000000000007', 'HREC-2026-038', 'Yarning circles with Aboriginal community health workers', '20000000-0000-4000-8000-000000000001', 'full', 'Dr Lena Thompson', 'lena.thompson@example.org', 'Indigenous Health', 1, false, null, null,
  'revisions', ethics_today() - 60, ethics_today() - 58, '40000000-0000-4000-8000-000000000003', ethics_today() - 27, 0, ethics_today() - 27, 'revisions', ethics_today() - 26, null, null, null,
  null, null, null, null, null),
('50000000-0000-4000-8000-000000000008', 'HREC-2026-033', 'Exercise after breast cancer surgery', '20000000-0000-4000-8000-000000000001', 'full', 'Dr Isabel Cruz', 'isabel.cruz@example.org', 'Oncology', 1, false, null, null,
  'approved', ethics_today() - 150, ethics_today() - 147, '40000000-0000-4000-8000-000000000001', null, 0, ethics_today() - 100, 'approved with conditions', ethics_today() - 98,
  'Add the counselling contact to the participant information sheet and send the revised sheet.', ethics_today() - 10, null,
  ethics_today() - 100, ethics_today() + 1725, ethics_today() + 265, null, null),
('50000000-0000-4000-8000-000000000009', 'HREC-2026-035', 'Hand hygiene audit in day surgery', '20000000-0000-4000-8000-000000000001', 'low risk', 'Sarah Kim', 'sarah.kim@example.org', 'Infection Control', 1, false, null, null,
  'approved', ethics_today() - 20, ethics_today() - 18, null, null, 0, ethics_today() - 9, 'approved', null, null, null, null,
  ethics_today() - 9, ethics_today() + 1817, ethics_today() + 356, null, null),
('50000000-0000-4000-8000-000000000010', 'HREC-2025-012', 'Ketamine for treatment-resistant depression', '20000000-0000-4000-8000-000000000001', 'full', 'Prof Mark Ellison', 'mark.ellison@example.org', 'Psychiatry', 2, false, null, null,
  'approved', ethics_today() - 460, ethics_today() - 455, null, null, 14, ethics_today() - 400, 'approved', ethics_today() - 399, null, null, null,
  ethics_today() - 400, ethics_today() + 1425, ethics_today() + 330, null, null),
('50000000-0000-4000-8000-000000000011', 'HREC-2026-029', 'Covert observation in emergency waiting rooms', '20000000-0000-4000-8000-000000000001', 'full', 'Dr Oliver Shaw', 'oliver.shaw@example.org', 'Emergency Medicine', 1, true, null, null,
  'declined', ethics_today() - 110, ethics_today() - 106, '40000000-0000-4000-8000-000000000002', null, 0, ethics_today() - 56, 'declined', ethics_today() - 54, null, null, null,
  null, null, null, null, null),
('50000000-0000-4000-8000-000000000012', 'AEC-2025-004', 'Pain relief after abdominal surgery in rats', '20000000-0000-4000-8000-000000000002', 'full', 'Dr Grace Liu', 'grace.liu@example.org', 'Pharmacology', 1, false, 'Rat', 120,
  'approved', ethics_today() - 470, ethics_today() - 466, null, null, 0, ethics_today() - 420, 'approved', ethics_today() - 419, null, null, null,
  ethics_today() - 420, ethics_today() + 675, ethics_today() + 305, null, null),
('50000000-0000-4000-8000-000000000013', 'AEC-2026-009', 'Drench resistance in sheep on coastal pasture', '20000000-0000-4000-8000-000000000002', 'full', 'Dr Hamish Reid', 'hamish.reid@example.org', 'Veterinary Science', 1, false, 'Sheep', 60,
  'approved', ethics_today() - 30, ethics_today() - 28, '40000000-0000-4000-8000-000000000011', null, 0, ethics_today() - 21, 'approved', ethics_today() - 19, null, null, null,
  ethics_today() - 21, ethics_today() + 1074, ethics_today() + 344, null, null),
('50000000-0000-4000-8000-000000000014', 'AEC-2023-002', 'Fish welfare in recirculating tanks', '20000000-0000-4000-8000-000000000002', 'full', 'Dr Nina Patel', 'nina.patel@example.org', 'Aquaculture', 1, false, 'Atlantic salmon', 200,
  'closed', ethics_today() - 1150, ethics_today() - 1146, null, null, 0, ethics_today() - 1100, 'approved', ethics_today() - 1099, null, null, null,
  ethics_today() - 1100, ethics_today() - 230, null, ethics_today() - 200, ethics_today() - 200),
('50000000-0000-4000-8000-000000000015', 'HREC-2026-039', 'Burnout among junior doctors', '20000000-0000-4000-8000-000000000001', 'full', 'Dr James Carter', 'james.carter@example.org', 'Medical Education', 1, true, null, null,
  'in review', ethics_today() - 15, ethics_today() - 14, '40000000-0000-4000-8000-000000000004', null, 0, null, null, null, null, null, null,
  null, null, null, null, null),
('50000000-0000-4000-8000-000000000016', 'HREC-2024-044', 'Fall prevention in residential aged care', '20000000-0000-4000-8000-000000000001', 'full', 'Dr Paula Henderson', 'paula.henderson@example.org', 'Aged Care', 4, false, null, null,
  'approved', ethics_today() - 680, ethics_today() - 676, null, null, 0, ethics_today() - 600, 'approved', ethics_today() - 598, null, null, null,
  ethics_today() - 600, ethics_today() - 150, ethics_today() - 235, null, null)
on conflict do nothing;

insert into reviews (id, application_id, member_id, assigned_on, due_on, returned_on, recommendation, comments, conflict) values
('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000006', ethics_today() - 21, ethics_today() - 7, null, null, null, null),
('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', ethics_today() - 21, ethics_today() - 7, ethics_today() - 9, 'approve with conditions', 'Participant information sheet is long for 18 year olds. Ask for a one-page version.', null),
('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', ethics_today() - 76, ethics_today() - 62, ethics_today() - 64, 'revisions', 'Consent from parents in the first 48 hours after birth needs a plan for distress.', null),
('60000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000007', ethics_today() - 76, ethics_today() - 62, ethics_today() - 60, 'approve with conditions', 'Sample storage period is not stated.', null),
('60000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000005', ethics_today() - 55, ethics_today() - 41, ethics_today() - 40, 'revisions', 'Community consultation letters are not attached.', null),
('60000000-0000-4000-8000-000000000006', '50000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000006', ethics_today() - 55, ethics_today() - 41, ethics_today() - 43, 'revisions', 'Data ownership with the community is not described.', null),
('60000000-0000-4000-8000-000000000007', '50000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000001', ethics_today() - 17, ethics_today() - 3, ethics_today() - 10, 'approve', 'Negligible risk audit. Fine.', null),
('60000000-0000-4000-8000-000000000008', '50000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000012', ethics_today() - 27, ethics_today() - 22, ethics_today() - 23, 'approve', 'Humane endpoints are clear.', null),
('60000000-0000-4000-8000-000000000009', '50000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000013', ethics_today() - 27, ethics_today() - 22, ethics_today() - 22, 'approve', null, null),
('60000000-0000-4000-8000-000000000010', '50000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000007', ethics_today() - 13, ethics_today() + 1, ethics_today() - 3, 'approve', 'Low burden survey.', 'Supervises the student investigator'),
('60000000-0000-4000-8000-000000000011', '50000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000002', ethics_today() - 13, ethics_today() + 1, null, null, null, null),
('60000000-0000-4000-8000-000000000012', '50000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000004', ethics_today() - 100, ethics_today() - 86, ethics_today() - 88, 'decline', 'Deception without a debrief plan.', null)
on conflict do nothing;

insert into amendments (id, name, application_id, summary, submitted_on, decided_on, outcome) values
('70000000-0000-4000-8000-000000000001', 'AMD-0001', '50000000-0000-4000-8000-000000000001', 'Add a second hospital site', ethics_today() - 40, null, null),
('70000000-0000-4000-8000-000000000002', 'AMD-0002', '50000000-0000-4000-8000-000000000003', 'Extend recruitment by six months', ethics_today() - 60, ethics_today() - 50, 'approved')
on conflict do nothing;

insert into reports (id, application_id, kind, received_on, participants, animals_used, records_secure, summary) values
('80000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'progress', ethics_today() - 405, 84, null, true, 'Recruitment on track at the first site.'),
('80000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 'progress', ethics_today() - 300, 412, null, true, 'Five-year follow-up under way.'),
('80000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000003', 'progress', ethics_today() - 20, 61, null, true, 'Recruitment extended by amendment.'),
('80000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000010', 'progress', ethics_today() - 35, 38, null, true, 'One serious adverse event, reported.'),
('80000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000012', 'progress', ethics_today() - 60, null, 132, true, 'Extra cohort run after two surgical failures.'),
('80000000-0000-4000-8000-000000000006', '50000000-0000-4000-8000-000000000014', 'final', ethics_today() - 200, null, 184, true, 'Study complete. Results submitted for publication.'),
('80000000-0000-4000-8000-000000000007', '50000000-0000-4000-8000-000000000016', 'progress', ethics_today() - 600 + 365, 220, null, true, 'All four facilities recruiting.')
on conflict do nothing;

insert into events (id, name, application_id, kind, occurred_on, reported_on, summary, action, closed_on) values
('90000000-0000-4000-8000-000000000001', 'EV-0001', '50000000-0000-4000-8000-000000000003', 'protocol deviation', ethics_today() - 90, ethics_today() - 88, 'Two participants consented on an old version of the information sheet.', 'Re-consented on the current version.', ethics_today() - 70),
('90000000-0000-4000-8000-000000000002', 'EV-0002', '50000000-0000-4000-8000-000000000012', 'unexpected death', ethics_today() - 15, ethics_today() - 14, 'One rat found dead on day two after surgery, before the humane endpoint check.', null, null),
('90000000-0000-4000-8000-000000000003', 'EV-0003', '50000000-0000-4000-8000-000000000010', 'serious adverse event', ethics_today() - 20, ethics_today() - 12, 'Participant admitted to hospital with raised blood pressure after a dose.', null, null)
on conflict do nothing;

insert into activity (id, application_id, happened_on, note) values
('a0000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000007', ethics_today() - 26, 'Decision letter sent asking for the consultation letters and a data ownership statement.'),
('a0000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', ethics_today() - 30, 'Reminder sent for the annual progress report.'),
('a0000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000012', ethics_today() - 14, 'Vet notified of the unexpected death; necropsy requested.')
on conflict do nothing;
