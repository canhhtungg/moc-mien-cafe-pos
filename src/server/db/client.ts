import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { CAFE_SCHEMA_STATEMENTS } from "@/server/db/schema";
import { seedCafeDatabase } from "@/server/db/seed";

let dbInstance: Client | null = null;
let initPromise: Promise<void> | null = null;

function resolveDbUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  if (process.env.CAFE_DB_URL) {
    return process.env.CAFE_DB_URL;
  }
  if (process.env.NODE_ENV === "test") {
    return "file::memory:?cache=shared";
  }
  if (process.env.VERCEL) {
    return "file:/tmp/mocmien-cafe.db";
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "mocmien-cafe.db")}`;
}

export function getDbClient(): Client {
  if (!dbInstance) {
    dbInstance = createClient({
      url: resolveDbUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return dbInstance;
}

export async function ensureCafeDbReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = getDbClient();
      await db.batch(
        CAFE_SCHEMA_STATEMENTS.map((sql) => ({ sql, args: [] })),
        "write"
      );
      const staffCount = await db.execute("SELECT COUNT(*) AS cnt FROM cafe_staff");
      if (Number(staffCount.rows[0]?.cnt ?? 0) === 0) {
        await seedCafeDatabase(db);
      }
    })();
  }
  await initPromise;
}

export async function resetCafeDatabaseToSeed(): Promise<void> {
  const db = getDbClient();
  await db.batch(
    [
      "DROP TABLE IF EXISTS cafe_order_items",
      "DROP TABLE IF EXISTS cafe_orders",
      "DROP TABLE IF EXISTS cafe_customers",
      "DROP TABLE IF EXISTS cafe_ingredients",
      "DROP TABLE IF EXISTS cafe_tables",
      "DROP TABLE IF EXISTS cafe_toppings",
      "DROP TABLE IF EXISTS cafe_menu",
      "DROP TABLE IF EXISTS cafe_staff",
      "DROP TABLE IF EXISTS cafe_settings",
    ].map((sql) => ({ sql, args: [] })),
    "write"
  );
  initPromise = null;
  await ensureCafeDbReady();
}
