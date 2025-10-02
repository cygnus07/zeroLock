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

