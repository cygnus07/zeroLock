import pg from 'pg'
import { getDbConfig } from '../config/database.js'
import  logger  from'./logger.js'

const { Pool } = pg
let pool = null

export const createPool = () => {
    if(pool) return pool

    const config = getDbConfig()
    console.log(config)
    pool = new Pool(config.connection)

    pool.on('connect', (client) => {
       if(pool){
         logger.logDatabase('Client connected', {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        })
       }
    })

    pool.on('error', (err, client) => {
        logger.logError(err, null, 'Unexpected error on idle database client')
    })

    pool.on('remove', () => {
        if(pool){
          logger.logDatabase('Client removed', {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount
        })
        }
    })

    return pool

}

export const query = async (text, params) => {
    const start = Date.now()
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    try {
        const pool = createPool()

        logger.logDatabase('Query started', {
            queryId,
            query: text.substring(0,100),
            paramCount: params?.length || 0
        })

        const result = await pool.query(text, params)
        const duration = Date.now() - start

        logger.logDatabase('Query completed', {
            queryId,
            query: text.substring(0,100),
            duration: `${duration}ms`,
            rowCount: result.rowCount,
            poolStats: {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount
            }
        })

        if(duration > 1000){
            logger.warn('Slow query detected', {
                queryId,
                query: text.substring(0,200),
                duration: `${duration}ms`
            })
        }

        return result
    } catch (error) {
        const duration = Date.now() - start
        logger.logError(error, null, 'Database query failed')
        logger.logDatabase('Query error details', {
            queryId,
            query: text.substring(0,100),
            duration: `${duration}ms`,
            errorCode: error.code,
            errorDetail: error.detail,
        })

        throw error
    }
}


export const getClient = async () => {
    const pool = createPool()
    const client = await pool.connect()

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2,9)}`

    const checkoutTime = Date.now()

    logger.logDatabase('Client checked out', {
        clientId,
        poolStats: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
        }
    })

    const query = client.query.bind(client)
    const release = client.release.bind(client)

    const timeout = setTimeout( () => {
        const heldDuration = Date.now() - checkoutTime
        logger.logSecurity('Client held too long', {
            clientId,
            heldDuration: `${heldDuration}ms`,
            warning: 'Possible connection leak'
        })
    }, 5000)

    client.release = () => {
        clearTimeout(timeout)
        const heldDuration = Date.now()- checkoutTime

        logger.logDatabase('Client released', {
            clientId,
            heldDuration: `${heldDuration}ms`,
            poolStats: {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount,
            }
        })

        release()
    }

    return client
}


export const transaction = async (callback) => {
  const client = await getClient();
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const start = Date.now();
  
  try {
    logger.logDatabase('Transaction started', { transactionId });
    
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    
    const duration = Date.now() - start;
    logger.logDatabase('Transaction committed', {
      transactionId,
      duration: `${duration}ms`,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.logDatabase('Transaction rolling back', { transactionId });
    await client.query('ROLLBACK');
    
    logger.logError(error, null, 'Transaction failed');
    logger.logDatabase('Transaction rolled back', {
      transactionId,
      duration: `${duration}ms`,
    });
    
    throw error;
  } finally {
    client.release();
  }
};

export const checkConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    logger.info('Database connection successful', { 
      timestamp: result.rows[0].now,
      poolReady: true,
    });
    return true;
  } catch (error) {
    logger.logError(error, null, 'Database connection failed');
    return false;
  }
};

export const closePool = async () => {
  if (pool) {
    logger.info('Closing database pool', {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
    });
    
    await pool.end();
    pool = null;
    
    logger.info('Database pool closed successfully');
  }
};
