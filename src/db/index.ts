import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Ek hi Pool poore app me reuse hota hai.
 * Next.js dev mode har save par module reload karta hai, isliye
 * globalThis par cache kiya gaya hai — warna connections khatam ho jayenge.
 */
const globalForDb = globalThis as unknown as {
  __poojaPathPool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL set nahi hai. .env file me database URL daalein.",
    );
  }

  // Render / kisi bhi managed Postgres par SSL chahiye hota hai.
  const needsSsl =
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1") &&
    !connectionString.includes("sslmode=disable");

  return new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
}

export const pool = globalForDb.__poojaPathPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__poojaPathPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
