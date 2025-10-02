create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email varchar(255) unique not null,
    username varchar(50) unique not null,

    srp_salt varchar(64) not null,
    srp_verifier text not null,

    vault_key_encrypted text not null,
    public_key text not null,
    private_key_encrypted text not null,

    account_locked boolean default false,
    failed_login_attempts integer default 0,
    last_failed_login timestamp with time zone,

    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp,
    last_login timestamp with time zone
);

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update
    on users for each row execute function update_updated_at_column()