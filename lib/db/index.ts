import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Cache the pool in globalThis to prevent creating a new pool on every
// hot-module-reload in dev mode. Each new Pool opens fresh TCP+SSL
// connections to Neon, which takes 2-5 seconds.
const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined
}

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // limit connections for serverless
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Neon serves a valid publicly-trusted cert — no reason to disable
    // certificate validation and expose the connection to MITM.
    ssl: true,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = pool
}

export { pool }
export const db = drizzle(pool, { schema })
