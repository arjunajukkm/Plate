create table if not exists exercises (
  id text primary key,
  user_id text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists exercises_user_name_idx
  on exercises (user_id, lower(name));

create index if not exists exercises_user_idx on exercises (user_id);

create table if not exists sets (
  id text primary key,
  user_id text not null,
  exercise_id text not null,
  weight_kg double precision not null,
  reps integer not null,
  performed_on date not null,
  logged_at timestamptz not null
);

create index if not exists sets_user_day_idx on sets (user_id, performed_on desc);
