/**
 * .env ko sabse pehle load karta hai.
 * Isko har script me sabse upar import karein — baaki imports se pehle.
 * Render par .env file nahi hoti; wahan values dashboard se aati hain.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

export {};
