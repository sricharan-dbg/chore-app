-- Run this in your Supabase SQL editor to set up the database

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  role text,
  created_at timestamptz default now()
);

create table if not exists chores (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date date not null,
  color_index integer default 0,
  recurrence_type text default 'none',
  custom_days integer[] default '{}',
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists chore_assignments (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid references chores(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  unique(chore_id, member_id)
);

-- Enable Row Level Security (open for now — anyone with the URL can access)
alter table members enable row level security;
alter table chores enable row level security;
alter table chore_assignments enable row level security;

create policy "Allow all on members" on members for all using (true) with check (true);
create policy "Allow all on chores" on chores for all using (true) with check (true);
create policy "Allow all on chore_assignments" on chore_assignments for all using (true) with check (true);
