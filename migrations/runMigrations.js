import path from 'path'
import { fileURLToPath} from 'url'
import { checkConnection, query, closePool } from '../src/utils/database.js'
import fs from 'fs/promises'
import logger from '../src/utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createMigrationsTable = async () => {
    const sql = `
        create table if not exists migrations (
        id serial primary key,
        filename  varchar(255) unique not null,
        executed_at timestamp with time zone default current_timestamp
        )
    `
    await query(sql)
    logger.info('Migrations table ready')
}

const getExecutedMigrations = async () => {
    const result = await query('select filename from migrations order by filename')
    return result.rows.map(row => row.filename)
}

const executeMigration = async (filename) => {
    const filepath = path.join(__dirname, filename)
    const sql = await fs.readFile(filepath, 'utf8')

    try {
        await query(sql)
        await query(
            'insert into migrations (filename) values ($1)',
            [filename]
        )

        logger.info(`Migrations executed: ${filename}`)
    } catch (error) {
        logger.error(`Migrations failed: ${filename}`, { error: error.message})
        throw error
    }
}

const runMigrations = async () => {
    try {
        logger.info('Starting database migrations...')
        const isConnected = await checkConnection()
        if(!isConnected){
            throw new Error('Cannot connect to database')
        }

        await createMigrationsTable()

        const files = await fs.readdir(__dirname)
        const migrationFiles = files
                    .filter(f => f.endsWith('.sql'))
                    .sort()

        const executedMigrations = await getExecutedMigrations()

        const pendingMigrations = migrationFiles.filter(
            f => !executedMigrations.includes(f)
        )

        if(pendingMigrations.length === 0) {
            logger.info('No pending migrations')
            return
        }

        logger.info(`Found ${pendingMigrations.length} pending migrations`)

        for(const migration of pendingMigrations){
            await executeMigration(migration)
        }

        logger.info('All migrations completed successfully')
    } catch (error) {
        logger.error('Migration runner failed', { error: error.message})
        process.exit(1)
    } finally {
        await closePool()
    }
}

if(process.argv[1] === fileURLToPath(import.meta.url)){
    runMigrations()
}

export default runMigrations

