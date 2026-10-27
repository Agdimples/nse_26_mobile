grant select on table public.buses to authenticated;

alter table public.buses enable row level security;

drop policy if exists "Authenticated users can read buses" on public.buses;

create policy "Authenticated users can read buses"
  on public.buses
  for select
  to authenticated
  using (true);