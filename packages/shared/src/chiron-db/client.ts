import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { resolvePostgresSsl } from '../database.js';
import { migrateChironDb } from './migrations.js';
import { chironSchema } from './schema.js';

export type ChironDb = NodePgDatabase<typeof chironSchema>;

let pool: pg.Pool | undefined;
let db: ChironDb | undefined;
let ready: Promise<void> | undefined;

/**
 * Chiron's tracker database: one small pool per process on `DATABASE_URL`, migrated on first
 * use (idempotent, advisory-locked). Separate from sign-in's and Mastra's pools by design, so a
 * slow tracker query never starves sign-in.
 */
export async function chironDb(connectionString = process.env.DATABASE_URL): Promise<ChironDb> {
  if (!connectionString) throw new Error('DATABASE_URL is not set, so Chiron has no tracker.');
  if (!pool) {
    // node-postgres lets the URL's `sslmode` override `ssl` and treats `require` as full
    // verification, which fails on RDS. Same rule as sign-in's pool (apps/web/app/lib/auth.ts).
    const ssl = resolvePostgresSsl(connectionString);
    let url = connectionString;
    if (ssl !== undefined) {
      const u = new URL(connectionString);
      u.searchParams.delete('sslmode');
      url = u.toString();
    }
    pool = new pg.Pool({ connectionString: url, max: 4, ...(ssl === undefined ? {} : { ssl }) });
    db = drizzle(pool, { schema: chironSchema });
  }
  ready ??= migrateChironDb(pool).then(() => undefined);
  try {
    await ready;
  } catch (err) {
    ready = undefined;
    throw err;
  }
  return db!;
}

export async function closeChironDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
  db = undefined;
  ready = undefined;
}
