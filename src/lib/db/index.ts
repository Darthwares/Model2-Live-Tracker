import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create a lazy-loaded database connection
function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

// Export a proxy that lazily initializes the database
let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as ReturnType<typeof createDb>)[prop as keyof ReturnType<typeof createDb>];
  },
});

export * from './schema';
