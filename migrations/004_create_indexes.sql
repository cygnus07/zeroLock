create index if not exists idx_users_email on users(email);
create index if not exists idx_users_username on users(username);
create index if not exists idx_users_account_locked on users(account_locked) where account_locked = true;
create index if not exists idx_users_created_at on users(created_at desc);
