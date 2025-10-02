

class SecurityLog {
    static actions = {
        // auth
        LOGIN_ATTEMPT: 'login_attemp',
        LOGIN_SUCCESS: 'login_success',
        LOGIN_FAILED: 'login_failed',
        LOGOUT: 'logout',

        // accout mgmt
        USER_CREATED: 'user_created',
        ACCOUNT_LOCKED: 'account_locked',
        ACCOUNT_UNLOCKED: 'account_unlocked',
        ACCOUNT_DELETED: 'account_deleted',
        PASSWORD_CHANGED: 'password_changed',

        // vault ops
        VAULT_ACCESSED: 'vault_accessed',
        VAULT_KEY_UPDATED: 'vault_key_updated',
        VAULT_ITEM_CREATED: 'vault_item_created',
        VAULT_ITEM_DELETED: 'vault_item_deleted',
        VAULT_ITEM_SHARED: 'vault_item_shared',

        // security events
        SUSPICIOUS_ACTIVITY: 'suspicious_activity',
        RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
        INVALID_TOKEN: 'invalid_token',
        BREACH_CHECK: 'breach-check'
    }

    
}