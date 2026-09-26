// One-off script: applies every .sql file in drizzle/ that hasn't run yet,
// tracked in drizzle's own __drizzle_migrations table. Used by `npm run
// db:migrate` locally and as the deploy step in production.
import dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.log('Migrations applied.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
