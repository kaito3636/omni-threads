create table if not exists line_follows (
  id          uuid primary key default gen_random_uuid(),
  line_user_id text,
  followed_at  timestamptz not null default now()
);
