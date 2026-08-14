/**
 * Migration runner — `npm run db:migrate`
 *
 * drizzle/ folder ki saari .sql files ko naam ke order me chalata hai
 * aur "_pooja_migrations" table me record rakhta hai, taaki dobara na chale.
 * Ye script safe hai — kitni bhi baar chala sakte hain.
 */
import "./load-env";

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL set nahi hai.");
    process.exit(1);
  }

  const needsSsl =
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1") &&
    !connectionString.includes("sslmode=disable");

  const cleanUrl = connectionString
    .replace(/([?&])sslmode=[^&]*&?/g, "$1")
    .replace(/[?&]$/, "");

  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_pooja_migrations" (
        "name" text PRIMARY KEY,
        "applied_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set(
      (await client.query<{ name: string }>('SELECT name FROM "_pooja_migrations"'))
        .rows.map((r) => r.name),
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      await client.query("BEGIN");
      try {
        for (const statement of statements) {
          await client.query(statement);
        }
        await client.query(
          'INSERT INTO "_pooja_migrations" (name) VALUES ($1)',
          [file],
        );
        await client.query("COMMIT");
        console.log(`✅ applied: ${file} (${statements.length} statements)`);
        ran++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`❌ failed: ${file}`);
        throw err;
      }
    }

    console.log(
      ran === 0
        ? "✨ Database pehle se up-to-date hai."
        : `✨ ${ran} migration(s) apply ho gayin.`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
