-- Schaduwmailbox: project e-mailadres + berichtenopslag

-- ───────────────────────────────────────────
-- 1. PROJECT EMAIL ADDRESS
-- ───────────────────────────────────────────

alter table public.projects
add column if not exists email_address text unique;

comment on column public.projects.email_address is 'Uniek projectmailadres (bijv. project-abc@verbouwmaat.nl)';

 create unique index if not exists idx_projects_email on public.projects(email_address) where email_address is not null;

-- ───────────────────────────────────────────
-- 2. MESSAGES (inkomend & uitgaand)
-- ───────────────────────────────────────────

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  direction text not null default 'inbound'
    check (direction in ('inbound', 'outbound')),
  from_address text not null,
  to_address text not null,
  subject text,
  body_text text,
  body_html text,
  thread_id text,
  provider_message_id text,
  status text not null default 'received'
    check (status in ('received', 'sent', 'delivered', 'bounced', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.messages is 'Alle e-mailcommunicatie rondom een project';
comment on column public.messages.direction is 'inbound = ontvangen, outbound = verstuurd';

 create index idx_messages_project on public.messages(project_id, created_at desc);
 create index idx_messages_thread on public.messages(thread_id);
 create index idx_messages_provider on public.messages(provider_message_id);

-- ───────────────────────────────────────────
-- 3. MESSAGE ATTACHMENTS
-- ───────────────────────────────────────────

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages on delete cascade,
  filename text not null,
  content_type text,
  size_bytes int,
  storage_path text,
  created_at timestamptz not null default now()
);

 create index idx_attachments_message on public.message_attachments(message_id);

-- ───────────────────────────────────────────
-- 4. RLS: MESSAGES
-- ───────────────────────────────────────────

 alter table public.messages enable row level security;
 alter table public.messages force row level security;

 create policy "Users can view own messages"
   on public.messages for select to authenticated
   using (is_project_owner(project_id));

 create policy "Users can insert own messages"
   on public.messages for insert to authenticated
   with check (is_project_owner(project_id));

-- ───────────────────────────────────────────
-- 5. RLS: ATTACHMENTS
-- ───────────────────────────────────────────

 alter table public.message_attachments enable row level security;
 alter table public.message_attachments force row level security;

 create policy "Users can view own attachments"
   on public.message_attachments for select to authenticated
   using (message_id in (
     select m.id from public.messages m
     join public.projects p on p.id = m.project_id
     where p.user_id = auth.uid()
   ));
