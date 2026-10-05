-- Newsletter signup table + insert-only RLS (mirrors analytics_event's pattern:
-- anyone can insert, only admins can read).

create table if not exists newsletter_signup (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_signup enable row level security;

-- Idempotent: the baseline schema already defines these policies.
drop policy if exists "newsletter_signup insert" on newsletter_signup;
create policy "newsletter_signup insert" on newsletter_signup for insert with check (true);
drop policy if exists "newsletter_signup admin read" on newsletter_signup;
create policy "newsletter_signup admin read" on newsletter_signup for select using (is_admin());
