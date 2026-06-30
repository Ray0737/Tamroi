-- Community post likes
create table if not exists community_post_likes (
  post_id    uuid references community_posts(id) on delete cascade,
  user_id    uuid references auth.users(id)       on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

alter table community_post_likes enable row level security;

create policy "see likes"         on community_post_likes for select using (true);
create policy "insert own like"   on community_post_likes for insert with check (auth.uid() = user_id);
create policy "delete own like"   on community_post_likes for delete using (auth.uid() = user_id);
