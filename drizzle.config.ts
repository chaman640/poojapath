/**
 * Sirf development ke liye — naye migration SQL generate karne ke liye.
 * Chalane ka tareeka:   npm run db:generate
 * (drizzle-kit npx se download hota hai, project me install nahi hai —
 *  isse production dependencies saaf rehti hain.)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

if (existsSync(join(process.cwd(), ".env"))) {
  process.loadEnvFile(join(process.cwd(), ".env"));
}

const config = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
};

export default config;
