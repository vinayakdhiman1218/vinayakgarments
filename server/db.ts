
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create postgres connection with retry logic
const createClient = () => {
  const client = postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: {
      application_name: "rest-express"
    }
  });

  return client;
};

// Create the drizzle database instance
export const db = drizzle(createClient(), { schema });
