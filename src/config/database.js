import { config } from "./index.js";

export const dbConfig = {
    development: {
        client: 'pg',
        connection: {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name,
            ssl: config.database.ssl ? { rejectUnathorized: false} : false,
        },
        pool: {
            min: 2,
            max: 10,
            idleTimeoutMillis: 30000,
        }
    },

    test: {
        client: 'pg',
        connection: {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name,
            ssl: false,
        },
        pool: {
            min: 2,
            max: 10,
        }
    },
    production: {
        client: 'pg',
        connection: {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name,
            ssl: config.database.ssl ? { rejectUnathorized: false} : false,
        },
        pool: {
            min: 2,
            max: 20,
            idleTimeoutMillis: 30000,
        }
    }
}


export const getDbConfig = () => {
    const env = config.env
    return dbConfig[env] || dbConfig.development
}