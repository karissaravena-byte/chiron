import type { Pool, PoolClient } from 'pg';
import { CHIRON_APP_SCHEMA } from './schema.js';

/**
 * Chiron's migrations, embedded as SQL so they ship inside both apps' builds (no migrations
 * folder to copy into the Mastra or Next bundle). Append only: never edit a migration that has
 * run; add a new one. `migrateChironDb()` applies the ones not yet recorded, in one transaction
 * each, under an advisory lock so the two apps starting together don't race.
 */
export interface Migration {
  id: string;
  sql: (schema: string) => string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: '0001_phase1_tracker',
    sql: (s) => `
create table ${s}.talent (
  id uuid primary key default gen_random_uuid(),
  last_name text, first_name text, middle_name text, nickname text,
  talent_type text check (talent_type in ('employee','consultant','project-based','intern')),
  level text, position text, group_name text, cost_center text, manager_name text,
  start_date date, last_day date,
  personal_email text, mobile text, contact_cleared_at timestamptz,
  company_email text, company_email_given_by text,
  employee_id text, employee_id_given_by text,
  source text not null check (source in ('argus-handoff','entered-by-karissa','test-hire')),
  argus_ref text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_email_has_source check (company_email is null or company_email_given_by = 'karissa'),
  constraint employee_id_has_source check (employee_id is null or employee_id_given_by in ('karissa','margie'))
);

create table ${s}.onboarding (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references ${s}.talent(id),
  hire_confirmed_on date not null,
  checklist_version integer not null,
  checklist_confirmed_at timestamptz, checklist_confirmed_by text,
  status text not null default 'open' check (status in ('open','complete')),
  completed_at timestamptz, completed_by text,
  prep_notes jsonb not null default '{"missing":[],"flags":[],"verify":[]}',
  created_at timestamptz not null default now()
);

create table ${s}.step (
  id uuid primary key default gen_random_uuid(),
  run_kind text not null check (run_kind in ('onboarding','offboarding')),
  run_id uuid not null,
  step_key text not null, label text not null, stage text not null, detail text,
  status text not null check (status in ('pending','drafted','awaiting-approval','sent','waiting-on-others','done','n-a','to-confirm')),
  owner text, due_on date, done_at timestamptz, last_reminder_at timestamptz, note text,
  sort_order integer not null default 0,
  constraint step_run_key unique (run_kind, run_id, step_key)
);

create table ${s}.draft (
  id uuid primary key default gen_random_uuid(),
  run_kind text not null check (run_kind in ('onboarding','offboarding','manpower','tracking')),
  run_id uuid not null,
  step_key text not null,
  channel text not null check (channel in ('email','calendar-invite','slack')),
  title text not null,
  template_key text not null, template_version integer not null,
  to_address text not null, real_recipient text not null,
  subject text not null, body text not null,
  blanks text[] not null default '{}',
  due_on date,
  status text not null default 'draft' check (status in ('draft','approved','sent','discarded','superseded')),
  version integer not null default 1,
  edited_by_karissa boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ${s}.approval (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references ${s}.draft(id),
  subject_ref text,
  approver_user_id text not null,
  approver_role text not null check (approver_role in ('karissa','mikki')),
  decision text not null check (decision in ('approved','rejected')),
  content_hash text not null,
  decided_at timestamptz not null default now(),
  constraint approval_has_subject check (draft_id is not null or subject_ref is not null)
);

create table ${s}.send_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('email','calendar-invite','slack-message','argus-open-role','masterlist-write')),
  via text not null check (via in ('chiron','manual')),
  draft_id uuid references ${s}.draft(id),
  approval_id uuid references ${s}.approval(id),
  target text not null,
  pilot_redirected boolean not null,
  payload_hash text not null,
  status text not null check (status in ('sent','failed')),
  error text,
  at timestamptz not null default now(),
  constraint approval_required check (kind = 'argus-open-role' or approval_id is not null)
);

create table ${s}.schedule_proposal (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references ${s}.onboarding(id),
  kind text not null check (kind in ('goals','one-on-one','mancom-one-on-one','nho','welcome-lunch')),
  with_contact_key text,
  starts_at timestamptz not null, ends_at timestamptz not null,
  calendar_checked boolean not null default false,
  status text not null default 'proposed' check (status in ('proposed','manager-approved','invited','declined'))
);

create table ${s}.holiday (
  date date primary key,
  name text not null, source_url text,
  status text not null default 'proposed' check (status in ('proposed','confirmed','rejected')),
  proposed_at timestamptz not null default now(),
  confirmed_by text, confirmed_at timestamptz
);

create table ${s}.away (
  id uuid primary key default gen_random_uuid(),
  person_key text not null,
  from_date date not null, to_date date not null,
  entered_by text not null
);

create table ${s}.scheduled_run (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('tracking','holiday-check','manpower-report')),
  scheduled_for date not null,
  outcome text not null check (outcome in ('ran','skipped-holiday','failed')),
  ran_at timestamptz not null default now()
);

create table ${s}.playbook_entry (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('checklist','template','clearance-checklist','contact-list')),
  key text not null, version integer not null,
  content jsonb not null,
  active boolean not null default false,
  changed_by text not null, reason text not null,
  created_at timestamptz not null default now(),
  constraint playbook_key_version unique (kind, key, version)
);
create unique index playbook_one_active on ${s}.playbook_entry (kind, key) where active;
`,
  },
];

/** Applies pending migrations. Safe to call on every boot; a no-op when up to date. */
export async function migrateChironDb(
  pool: Pool,
  schema: string = CHIRON_APP_SCHEMA,
): Promise<string[]> {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error(`Unsafe schema name: ${schema}`);
  const client: PoolClient = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query(`select pg_advisory_lock(hashtext('${schema}.migrations'))`);
    await client.query(`create schema if not exists ${schema}`);
    await client.query(
      `create table if not exists ${schema}.schema_migrations (id text primary key, applied_at timestamptz not null default now())`,
    );
    const done = new Set(
      (await client.query<{ id: string }>(`select id from ${schema}.schema_migrations`)).rows.map(
        (r) => r.id,
      ),
    );
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      await client.query('begin');
      try {
        await client.query(m.sql(schema));
        await client.query(`insert into ${schema}.schema_migrations (id) values ($1)`, [m.id]);
        await client.query('commit');
        applied.push(m.id);
      } catch (err) {
        await client.query('rollback');
        throw err;
      }
    }
  } finally {
    await client
      .query(`select pg_advisory_unlock(hashtext('${schema}.migrations'))`)
      .catch(() => undefined);
    client.release();
  }
  return applied;
}
