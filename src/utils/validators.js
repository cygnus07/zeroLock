import { z } from 'zod'

const email = z.string().email('Invalid email address')
                .max(255, 'Email must be less than 255 characters')
                .transform(val => val.toLowerCase())


const username = z
.string()
.min(3, 'Username must be at least 3 character')
.max(50, 'Username must be less than 50 characters')
.regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores and hyphens'
)

const password = z
.string()
.min(12, 'Password must be at least 12 characters')
.max(128, 'Password must be less than 128 characters')
.regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

const uuid = z.string().uuid('Invalid UUID format')

const srpSalt = z
.string()
.length(64, ' SRP salt must be exactly 64 characters')
.regex(/^[0-9a-f]+$/i, 'SRP salt must be hexadecimal')

const srpVerifier = z
.string()
.min(1, 'SRP verifier is required')
.max(1024, 'SRP verifier is too long')

const encryptedKey = z
.string()
.min(1, 'Encrypted key is required')
.max(4096, 'Encrypted key is too long')

const publicKey = z
.string()
.min(1, 'Public key is required')
.max(2048, 'Public key is too long')


export const authSchemas = {
    checkAvailability: z.object({
        email: email.optional(),
        username: username.optional()
    }).refine(
        data => data.email || data.username,
        'Either email or username must be provided'
    ),

    registerInit: z.object({
        email, 
        username
    }),

    registerComplete: z.object({
        email,
        username,
        srpSalt,
        srpVerifier,
        vaultKeyEncrypted: encryptedKey,
        publicKey,
        privateKeyEncrypted: encryptedKey
    }), 


    // login
    loginInit: z.object({
        identifier: z.string().min(1, 'Email or username is required')
    }),

    loginVerify: z.object({
        sessionId: uuid,
        clientProof: z.string().min(1, 'Client proof is required')
    }),


    changePassword: z.object({
        currentPassword: password,
        newPassword: password,
        srpSalt,
        srpVerifier,
    }),

    resetPasswordRequest: z.object({
        email,
    }),

    resetPasswordConfirm: z.object({
        token: z.string().min(1, 'Reset token is required'),
        srpSalt,
        srpVerifier
    }),


    updateProfile: z.object({
        username: username.optional(),
        email: email.optional(),
    }).refine(
        data => Object.keys(data).length > 0,
        'at least one field must be provided'
    )
}

export const vaultSchemas = {
    createItem: z.object({
        encryptedData: encryptedKey,
        type: z.enum(['login', 'note', 'card', 'identity']),
        favorite: z.boolean().default(false)
    }),

    updateItem: z.object({
        encryptedData: encryptedKey,
        favorite: z.boolean().optional(),
    }),

    shareItem: z.object({
        itemId: uuid,
        recipientId: uuid,
        encryptedKey: encryptedKey,
        permissions: z.enum(['read', 'write']).default('read')
    })
}

export const securitySchemas = {
    enable2FA: z.object({
        password,
        totpSecret: z.string().min(16, 'Invalid TOTP secret'),
        totpCode: z.string().length(6, 'TOTP code must be 6 digits')
    }),

    verify2FA: z.object({
        totpCode: z.string().length(6, 'TOTP code must be 6 digits')
    }),

    securityQuestion: z.object({
        question: z.string().min(10, 'Question too short').max(200),
        answerHash: z.string().min(1, 'Answer hash required')
    })
}

export const querySchemas = {
    pagination: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20)
    }),

    search: z.object({
        q: z.string().min(1, 'Search query required').max(100),
        type: z.enum(['all', 'login', 'note', 'card', 'identity']).default('all')
    }),

    dateRange: z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional()
    })
}

export const validate = (schema, data) => {
    return schema.parse(data)
}

export const safeValidate = (schema, data) => {
    const result = schema.safeParse(data)
    return result.success ? result.data : null
}

export default {
    auth: authSchemas,
    vault: vaultSchemas,
    security: securitySchemas,
    query: querySchemas
}