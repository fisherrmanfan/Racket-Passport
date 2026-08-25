import 'server-only'
import { Pool } from 'pg'

/**
 * One pool per process. Next's dev server re-evaluates modules on every edit,
 * so the pool is parked on globalThis — otherwise a morning of hot reloads
 * exhausts the pooler's connection slots.
 */
declare global {
  // eslint-disable-next-line no-var
  var __racketPool: Pool | undefined
}

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set (check .env)')
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase's pooler presents a cert chain that fails strict verification
    // from most client environments; this matches Supabase's own guidance
    // for node-postgres.
    ssl: { rejectUnauthorized: false },
    max: 8,
    idleTimeoutMillis: 30_000,
  })
}

export const pool: Pool = globalThis.__racketPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__racketPool = pool
}
