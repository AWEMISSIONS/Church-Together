import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
export function getDb() { if (!env.DB) throw new Error("Database binding is unavailable"); return drizzle(env.DB); }
