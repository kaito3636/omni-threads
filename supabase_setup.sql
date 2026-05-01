create table if not exists line_follows (
  id          uuid primary key default gen_random_uuid(),
  line_user_id text,
  followed_at  timestamptz not null default now()
);

create table if not exists posts_log (
  id          uuid primary key default gen_random_uuid(),
  posted_at   timestamptz not null default now(),
  account     text,
  post_index  int,
  post_type   text,
  preview     text
);
