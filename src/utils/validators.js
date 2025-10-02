import { z} from 'zod'

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

const public_key = z
.string()
.min(1, 'Public key is required')
.max(2048, 'Public key is too long')


export const authSchema = {
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
        currentPasword: password,
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

export const vaultSchemas = {}

export const securitySchemas = {}

export const querySchemas = {}