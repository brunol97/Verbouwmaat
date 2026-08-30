-- Buildy project data model
-- Tabellen: projects, floors, rooms, room_work_items, work_catalog

-- ───────────────────────────────────────────
-- 1. PROJECTS
-- ───────────────────────────────────────────

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  address text,
  status text not null default 'active'
    check (status in ('active', 'archived', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.projects is 'Een verbouwproject van een gebruiker';
comment on column public.projects.status is 'active | archived | completed';

-- Indexen
 create index idx_projects_user on public.projects(user_id, created_at desc);
 create index idx_projects_status on public.projects(user_id, status);

-- ───────────────────────────────────────────
-- 2. FLOORS
-- ───────────────────────────────────────────

create table if not exists public.floors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  name text not null,
  level int not null default 0,
  building_width numeric(10,2),
  building_depth numeric(10,2),
  image_url text,
  created_at timestamptz not null default now()
);

comment on table public.floors is 'Een verdieping binnen een project';

 create index idx_floors_project on public.floors(project_id, level);

-- ───────────────────────────────────────────
-- 3. ROOMS
-- ───────────────────────────────────────────

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors on delete cascade,
  name text not null,
  type text not null default 'living'
    check (type in ('living', 'kitchen', 'bedroom', 'bathroom', 'hallway', 'storage', 'stairs', 'outdoor', 'landing', 'closet')),
  width numeric(10,2) not null,
  depth numeric(10,2) not null,
  area numeric(10,2) not null,
  floor_area numeric(10,2) not null,
  wall_area numeric(10,2) not null,
  ceiling_area numeric(10,2) not null,
  position_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.rooms is 'Een ruimte binnen een verdieping';
comment on column public.rooms.position_json is '{x, y, width, depth} in meters';

 create index idx_rooms_floor on public.rooms(floor_id);

-- ───────────────────────────────────────────
-- 4. ROOM_WORK_ITEMS
-- ───────────────────────────────────────────

create table if not exists public.room_work_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms on delete cascade,
  work_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.room_work_items is 'Gekozen werkzaamheden per ruimte';

 create index idx_work_items_room on public.room_work_items(room_id);
 create index idx_work_items_status on public.room_work_items(status);

-- ───────────────────────────────────────────
-- 5. WORK_CATALOG (globale catalogus)
-- ───────────────────────────────────────────

create table if not exists public.work_catalog (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  label text not null,
  unit text not null default 'm2'
    check (unit in ('m2', 'stuks', 'lm', 'uur')),
  description text,
  applicable_room_types text[] not null default array[]::text[],
  default_unit_price numeric(10,2),
  created_at timestamptz not null default now()
);

comment on table public.work_catalog is 'Gestandaardiseerde werkzaamhedencatalogus';
comment on column public.work_catalog.applicable_room_types is 'Leeg array = van toepassing op alle ruimtes';

 create index idx_work_catalog_type on public.work_catalog(type);

-- ───────────────────────────────────────────
-- 6. HELPER: project owner check
-- ───────────────────────────────────────────

create or replace function public.is_project_owner(project_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.projects
    where id = project_uuid and user_id = auth.uid()
  );
$$;

-- ───────────────────────────────────────────
-- 7. RLS: PROJECTS
-- ───────────────────────────────────────────

 alter table public.projects enable row level security;
 alter table public.projects force row level security;

 create policy "Users can view own projects"
   on public.projects for select to authenticated
   using (user_id = auth.uid());

 create policy "Users can insert own projects"
   on public.projects for insert to authenticated
   with check (user_id = auth.uid());

 create policy "Users can update own projects"
   on public.projects for update to authenticated
   using (user_id = auth.uid());

 create policy "Users can delete own projects"
   on public.projects for delete to authenticated
   using (user_id = auth.uid());

-- ───────────────────────────────────────────
-- 8. RLS: FLOORS (via project)
-- ───────────────────────────────────────────

 alter table public.floors enable row level security;
 alter table public.floors force row level security;

 create policy "Users can view own floors"
   on public.floors for select to authenticated
   using (is_project_owner(project_id));

 create policy "Users can insert own floors"
   on public.floors for insert to authenticated
   with check (is_project_owner(project_id));

 create policy "Users can update own floors"
   on public.floors for update to authenticated
   using (is_project_owner(project_id));

 create policy "Users can delete own floors"
   on public.floors for delete to authenticated
   using (is_project_owner(project_id));

-- ───────────────────────────────────────────
-- 9. RLS: ROOMS (via floor -> project)
-- ───────────────────────────────────────────

 alter table public.rooms enable row level security;
 alter table public.rooms force row level security;

 create policy "Users can view own rooms"
   on public.rooms for select to authenticated
   using (floor_id in (
     select f.id from public.floors f
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

 create policy "Users can insert own rooms"
   on public.rooms for insert to authenticated
   with check (floor_id in (
     select f.id from public.floors f
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

 create policy "Users can update own rooms"
   on public.rooms for update to authenticated
   using (floor_id in (
     select f.id from public.floors f
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

 create policy "Users can delete own rooms"
   on public.rooms for delete to authenticated
   using (floor_id in (
     select f.id from public.floors f
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

-- ───────────────────────────────────────────
-- 10. RLS: ROOM_WORK_ITEMS (via room -> floor -> project)
-- ───────────────────────────────────────────

 alter table public.room_work_items enable row level security;
 alter table public.room_work_items force row level security;

 create policy "Users can view own work items"
   on public.room_work_items for select to authenticated
   using (room_id in (
     select r.id from public.rooms r
     join public.floors f on f.id = r.floor_id
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

 create policy "Users can insert own work items"
   on public.room_work_items for insert to authenticated
   with check (room_id in (
     select r.id from public.rooms r
     join public.floors f on f.id = r.floor_id
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

 create policy "Users can update own work items"
   on public.room_work_items for update to authenticated
   using (room_id in (
     select r.id from public.rooms r
     join public.floors f on f.id = r.floor_id
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

 create policy "Users can delete own work items"
   on public.room_work_items for delete to authenticated
   using (room_id in (
     select r.id from public.rooms r
     join public.floors f on f.id = r.floor_id
     join public.projects p on p.id = f.project_id
     where p.user_id = auth.uid()
   ));

-- ───────────────────────────────────────────
-- 11. RLS: WORK_CATALOG (iedereen mag lezen)
-- ───────────────────────────────────────────

 alter table public.work_catalog enable row level security;
 alter table public.work_catalog force row level security;

 create policy "Anyone can view work catalog"
   on public.work_catalog for select
   to authenticated, anon
   using (true);

 create policy "Only admins can modify work catalog"
   on public.work_catalog for all
   to authenticated
   using (false);

-- ───────────────────────────────────────────
-- 12. SEED: werkzaamhedencatalogus
-- ───────────────────────────────────────────

insert into public.work_catalog (type, label, unit, description, applicable_room_types)
values
  ('stucen',            'Stucen',                   'm2', 'Wanden en plafonds stucen',                    array['living', 'bedroom', 'hallway', 'landing']),
  ('vloerverwarming',   'Vloerverwarming leggen',   'm2', 'Vloerverwarmingssysteem aanleggen',            array['living', 'kitchen', 'bedroom', 'bathroom']),
  ('behangen',          'Behangen',                 'm2', 'Wanden behangen met behangpapier',             array['living', 'bedroom', 'hallway']),
  ('schilderen',        'Schilderen',               'm2', 'Wanden, plafonds of kozijnen schilderen',      array[]::text[]),
  ('tegelen',           'Tegelen',                  'm2', 'Wanden of vloeren tegelen',                    array['bathroom', 'kitchen']),
  ('vloerleggen',       'Vloer leggen',             'm2', 'Nieuwe vloer leggen',                          array[]::text[]),
  ('elektra',           'Elektra',                  'stuks', 'Elektrapunten aanleggen of verplaatsen',      array[]::text[]),
  ('sanitair',          'Sanitair',                 'stuks', 'Sanitair installeren of vervangen',           array['bathroom']),
  ('timmerwerk',        'Timmerwerk',               'uur',   'Timmerwerkzaamheden',                         array[]::text[])
on conflict (type) do nothing;

-- ───────────────────────────────────────────
-- 13. TRIGGER: updated_at
-- ───────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

 drop trigger if exists set_projects_updated_at on public.projects;
 create trigger set_projects_updated_at
   before update on public.projects
   for each row execute function public.set_updated_at();

 drop trigger if exists set_room_work_items_updated_at on public.room_work_items;
 create trigger set_room_work_items_updated_at
   before update on public.room_work_items
   for each row execute function public.set_updated_at();
