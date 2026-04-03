create extension if not exists "pgcrypto";

-- Pets
create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  species text not null check (species in ('slime','ghost','dragon','fairy','golem')),
  created_at timestamptz default now(),
  thirst numeric not null default 80,
  happiness numeric not null default 80,
  energy numeric not null default 80,
  hunger numeric,
  fear numeric,
  fire numeric,
  magic numeric,
  level integer not null default 1,
  xp integer not null default 0,
  age integer not null default 0,
  evolution_stage integer not null default 0 check (evolution_stage between 0 and 3),
  mood text not null default 'neutral'
    check (mood in ('happy','neutral','sad','sick','sleeping','bored')),
  is_asleep boolean not null default false,
  active_lore_chapter integer not null default 0,
  last_synced_at timestamptz default now(),
  last_interaction_at timestamptz default now()
);

alter table pets enable row level security;
create policy "own pet" on pets for all using (auth.uid() = user_id);

-- Lore unlocks
create table if not exists lore_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  species_id text not null,
  chapter_index integer not null,
  unlocked_at timestamptz default now(),
  unique (user_id, species_id, chapter_index)
);

alter table lore_unlocks enable row level security;
create policy "own lore" on lore_unlocks for all using (auth.uid() = user_id);

-- Daily minigame counts
create table if not exists minigame_daily_counts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  game_id text not null,
  count integer not null default 0,
  date date not null default current_date,
  unique (user_id, game_id, date)
);

alter table minigame_daily_counts enable row level security;
create policy "own counts" on minigame_daily_counts for all using (auth.uid() = user_id);
