create table if not exists srp_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    srp_b text not null,
    session_key varchar(64),
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default current_timestamp
);

create index idx_srp_sessions_expires on srp_sessions(expires_at);

create or replace function clean_expired_srp_sessions()
returns void as $$
begin  
    delete from srp_sessions where expires_at < now();
end;
$$ language plpgsql;