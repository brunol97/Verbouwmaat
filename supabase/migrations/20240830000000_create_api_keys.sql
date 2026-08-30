-- API keys tabel voor MCP (Model Context Protocol) authenticatie
-- Gebruikers kunnen meerdere keys aanmaken met verschillende scopes

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null default 'MCP Key',
  -- SHA-256 hash van de key (opslaan nooit de plain text key!)
  key_hash text not null,
  -- Prefix om keys te herkennen (bijv. vm_prod_abc123)
  prefix text not null,
  -- Scopes voor fine-grained access control
  scopes text[] not null default array['mcp'],
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,

  -- Indexes
  constraint api_keys_key_hash_unique unique (key_hash)
);

-- Index voor snelle lookup op hash
 create index idx_api_keys_hash on public.api_keys(key_hash);

-- Index voor gebruiker + actieve keys
 create index idx_api_keys_user on public.api_keys(user_id) where revoked_at is null;

-- RLS: gebruikers kunnen alleen hun eigen keys zien
 alter table public.api_keys enable row level security;

 create policy "Users can view own API keys"
   on public.api_keys
   for select
   to authenticated
   using (user_id = auth.uid());

 create policy "Users can insert own API keys"
   on public.api_keys
   for insert
   to authenticated
   with check (user_id = auth.uid());

 create policy "Users can update own API keys"
   on public.api_keys
   for update
   to authenticated
   using (user_id = auth.uid());

 create policy "Users can delete own API keys"
   on public.api_keys
   for delete
   to authenticated
   using (user_id = auth.uid());

-- Function om last_used_at te updaten bij gebruik
 create or replace function public.touch_api_key(key_hash_input text)
 returns void
 language plpgsql
 security definer
 as $$
 begin
   update public.api_keys
   set last_used_at = now()
   where key_hash = key_hash_input;
 end;
 $$;
