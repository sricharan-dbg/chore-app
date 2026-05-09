-- ============================================================
-- ChoreOS v2 — Run this in Supabase SQL Editor
-- Safe on both fresh databases and existing v1 projects
-- ============================================================

-- Step 1: Drop old triggers safely (tables may not exist on fresh DB)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'workspaces' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
  END IF;
END;
$$;

-- Step 2: Drop old functions
DROP FUNCTION IF EXISTS handle_new_user()          CASCADE;
DROP FUNCTION IF EXISTS handle_new_workspace()     CASCADE;
DROP FUNCTION IF EXISTS join_workspace_by_token(text) CASCADE;
DROP FUNCTION IF EXISTS get_workspace_by_token(text)  CASCADE;

-- Step 3: Drop v1 tables if migrating
DROP TABLE IF EXISTS chore_assignments CASCADE;
DROP TABLE IF EXISTS chores            CASCADE;
DROP TABLE IF EXISTS members           CASCADE;

-- ============================================================
-- Step 4: Create tables
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL DEFAULT '',
  avatar_color text        DEFAULT '#10b981',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text        DEFAULT '',
  owner_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token text        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text        DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at    timestamptz DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text        DEFAULT '',
  due_date        date,
  priority        text        DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  color_index     integer     DEFAULT 0,
  recurrence_type text        DEFAULT 'none',
  custom_days     integer[]   DEFAULT '{}',
  completed       boolean     DEFAULT false,
  created_by      uuid        REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignees (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (task_id, user_id)
);

-- ============================================================
-- Step 5: Row Level Security
-- ============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 6: Policies
-- ============================================================

-- profiles
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_insert ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;

-- All authenticated users can read any profile (needed to show names/avatars)
CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated USING (true);

-- Users can only insert/update their own profile row
CREATE POLICY profiles_insert ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- workspaces
DROP POLICY IF EXISTS workspaces_select ON workspaces;
DROP POLICY IF EXISTS workspaces_insert ON workspaces;
DROP POLICY IF EXISTS workspaces_update ON workspaces;
DROP POLICY IF EXISTS workspaces_delete ON workspaces;

CREATE POLICY workspaces_select ON workspaces
  FOR SELECT TO authenticated USING (
    owner_id = auth.uid()
    OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY workspaces_insert ON workspaces
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY workspaces_update ON workspaces
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY workspaces_delete ON workspaces
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- workspace_members
DROP POLICY IF EXISTS wm_select ON workspace_members;
DROP POLICY IF EXISTS wm_insert ON workspace_members;
DROP POLICY IF EXISTS wm_delete ON workspace_members;

CREATE POLICY wm_select ON workspace_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members wm2 WHERE wm2.user_id = auth.uid()
    )
  );

CREATE POLICY wm_insert ON workspace_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY wm_delete ON workspace_members
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- tasks
DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_delete ON tasks;

CREATE POLICY tasks_select ON tasks
  FOR SELECT TO authenticated USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY tasks_insert ON tasks
  FOR INSERT TO authenticated WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY tasks_update ON tasks
  FOR UPDATE TO authenticated USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY tasks_delete ON tasks
  FOR DELETE TO authenticated USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- task_assignees
DROP POLICY IF EXISTS ta_select ON task_assignees;
DROP POLICY IF EXISTS ta_insert ON task_assignees;
DROP POLICY IF EXISTS ta_delete ON task_assignees;

CREATE POLICY ta_select ON task_assignees
  FOR SELECT TO authenticated USING (
    task_id IN (
      SELECT id FROM tasks WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY ta_insert ON task_assignees
  FOR INSERT TO authenticated WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY ta_delete ON task_assignees
  FOR DELETE TO authenticated USING (
    task_id IN (
      SELECT id FROM tasks WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Step 7: Helper functions (SECURITY DEFINER for invite flow)
-- ============================================================

CREATE OR REPLACE FUNCTION get_workspace_by_token(p_token text)
RETURNS TABLE(id uuid, name text, description text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT w.id, w.name, w.description
    FROM public.workspaces w
    WHERE w.invite_token = p_token;
END;
$$;

CREATE OR REPLACE FUNCTION join_workspace_by_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id uuid;
BEGIN
  SELECT w.id INTO v_workspace_id
  FROM public.workspaces w
  WHERE w.invite_token = p_token;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, auth.uid(), 'member')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN v_workspace_id;
END;
$$;

-- ============================================================
-- Step 8: Trigger functions
-- Key fixes vs previous versions:
--   1. SET search_path = public  (required for SECURITY DEFINER in Supabase)
--   2. EXCEPTION block           (prevents trigger crash from blocking signup)
--   3. Explicit public. schema prefix on table references
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Never block user creation due to profile insert errors.
    -- The client will upsert the profile after login.
    RAISE WARNING 'handle_new_user: could not create profile for %, error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_workspace: error for workspace %, error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE PROCEDURE handle_new_workspace();
