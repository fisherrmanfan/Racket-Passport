'use strict';

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set (check .env)');
}

// Supabase's pooler presents a cert chain that fails strict verification
// from most client environments; rejectUnauthorized: false matches
// Supabase's own connection-string guidance for node-postgres.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = { pool };
