-- Keep only the newest snapshot for each data set.
create table if not exists public.ttang_snapshots (
  snapshot_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.ttang_snapshots enable row level security;

grant select on public.ttang_snapshots to anon, authenticated;

drop policy if exists "Anyone can read snapshots" on public.ttang_snapshots;
create policy "Anyone can read snapshots"
  on public.ttang_snapshots
  for select
  using (true);

-- Writes are performed by the worker with the service_role key.
