// Single shared connection pool + Drizzle instance for the whole app.
// Every module imports `db` from here rather than creating its own pool.
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { env } from '../config/env';

export const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });
