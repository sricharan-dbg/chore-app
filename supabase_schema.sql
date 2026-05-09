-- ============================================================
-- ChoreOS v2 — Run this in Supabase SQL Editor
-- Drop old tables first if migrating from v1
-- ============================================================

-- Drop old tables (v1)
drop table if exists chore_assignments cascade;
drop table if exists chores cascade;
drop table if exists members cascade;

-- Drop old triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_workspace_created on workspaces;
drop function if exists handle_new_user();
drop function if exists handle_new_workspace();
drop function if exists join_workspace_by_token(text);
drop function if exists get_workspace_by_token(text);

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  avatar_color text default '#10b981',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workspaces (private by default)
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  owner_id uuid references auth.users(id) on delete cascade not null,
  invite_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);

-- Workspace access control
create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- Tasks (scoped to workspace)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  title text not null,
  description text default '',
  due_date date,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  color_index integer default 0,
  recurrence_type text default 'none',
  custom_days integer[] default '{}',
  completed boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Task assignees (references workspace members via user_id)
create table if not exists task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  unique(task_id, user_id)
);

-- ============================================================
-- RLS
-- ============================================================

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;

-- Profiles: readable by all authenticated users, editable by owner
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- Workspaces: only visible to members
create policy "workspaces_select" on workspaces for select to authenticated using (
  owner_id = auth.uid() or
  id in (select workspace_id from workspace_members where user_id = auth.uid())
);
create policy "workspaces_insert" on workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "workspaces_update" on workspaces for update to authenticated using (owner_id = auth.uid());
create policy "workspaces_delete" on workspaces for delete to authenticated using (owner_id = auth.uid());

-- Workspace members: visible to members of same workspace
create policy "wm_select" on workspace_members for select to authenticated using (
  user_id = auth.uid() or
  workspace_id in (select workspace_id from workspace_members wm2 where wm2.user_id = auth.uid())
);
create policy "wm_insert" on workspace_members for insert to authenticated with check (user_id = auth.uid());
create policy "wm_delete" on workspace_members for delete to authenticated using (
  user_id = auth.uid() or
  workspace_id in (select id from workspaces where owner_id = auth.uid())
);

-- Tasks: visible only to workspace members
create policy "tasks_select" on tasks for select to authenticated using (
  workspace_id in (
    select id from workspaces where owner_id = auth.uid()
    union
    select workspace_id from workspace_members where user_id = auth.uid()
  )
);
create policy "tasks_insert" on tasks for insert to authenticated with check (
  workspace_id in (
    select id from workspaces where owner_id = auth.uid()
    union
    select workspace_id from workspace_members where user_id = auth.uid()
  )
);
create policy "tasks_update" on tasks for update to authenticated using (
  workspace_id in (
    select id from workspaces where owner_id = auth.uid()
    union
    select workspace_id from workspace_members where user_id = auth.uid()
  )
);
create policy "tasks_delete" on tasks for delete to authenticated using (
  workspace_id in (
    select id from workspaces where owner_id = auth.uid()
    union
    select workspace_id from workspace_members where user_id = auth.uid()
  )
);

-- Task assignees
create policy "ta_select" on task_assignees for select to authenticated using (
  task_id in (
    select id from tasks where workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  )
);
create policy "ta_insert" on task_assignees for insert to authenticated with check (
  task_id in (
    select id from tasks where workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  )
);
create policy "ta_delete" on task_assignees for delete to authenticated using (
  task_id in (
    select id from tasks where workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  )
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-add creator as workspace owner-member
create or replace function handle_new_workspace()
returns trigger as $$
begin
  insert into workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_workspace_created
  after insert on workspaces
  for each row execute procedure handle_new_workspace();

-- Look up workspace by invite token (bypasses RLS for the lookup)
create or replace function get_workspace_by_token(p_token text)
returns table(id uuid, name text, description text) as $$
begin
  return query
    select w.id, w.name, w.description
    from workspaces w
    where w.invite_token = p_token;
end;
$$ language plpgsql security definer;

-- Join a workspace via invite token
create or replace function join_workspace_by_token(p_token text)
returns uuid as $$
declare
  v_workspace_id uuid;
begin
  select w.id into v_workspace_id
  from workspaces w
  where w.invite_token = p_token;

  if v_workspace_id is null then
    raise exception 'Invalid invite token';
  end if;

  insert into workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  return v_workspace_id;
end;
$$ language plpgsql security definer;
