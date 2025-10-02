create table if not exists security_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete set null,
    action varchar(50) not null,
    success boolean not null,
    ip_address inet,
    user_agent text,
    details jsonb,
    timestamp timestamp with time zone default current_timestamp
);

create index idx_security_logs_user_id on security_logs(user_id);
create index idx_security_logs_timestamp on security_logs(timestamp desc);
create index idx_security_logs_action on security_logs(action);

create or replace function clean_old_security_logs()
returns void as $$
begin 
    delete from security_logs
    where timestamp < now() - interval '90 days'
    and action not in ('account_locked', 'password_reset', 'account_deleted');
end;
$$ language plpgsql;