import { createClient, type Client } from "@libsql/client";
import { get, put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import { CAFE_SCHEMA_STATEMENTS } from "@/server/db/schema";
import { seedCafeDatabase } from "@/server/db/seed";

let dbInstance: Client | null = null;
let schemaReadyPromise: Promise<void> | null = null;
let syncInFlight: Promise<void> | null = null;
let lastSyncedEtag: string | null = null;

const BLOB_STATE_KEY = "db/mocmien-cafe-state.json";

const SNAPSHOT_TABLES = [
  "cafe_staff",
  "cafe_menu",
  "cafe_toppings",
  "cafe_tables",
  "cafe_ingredients",
  "cafe_customers",
  "cafe_orders",
  "cafe_order_items",
  "cafe_settings",
] as const;

type SnapshotTableName = (typeof SNAPSHOT_TABLES)[number];

interface CafeDbSnapshot {
  version: number;
  updatedAt: string;
  tables: Record<SnapshotTableName, Array<Record<string, unknown>>>;
}

export function isBlobSyncEnabled(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV !== "test"
  );
}

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

async function exportSnapshotFromDb(db: Client): Promise<CafeDbSnapshot> {
  const tables = {} as Record<SnapshotTableName, Array<Record<string, unknown>>>;

  for (const tableName of SNAPSHOT_TABLES) {
    const res = await db.execute(`SELECT * FROM ${tableName}`);
    tables[tableName] = res.rows.map((row) => {
      const plain: Record<string, unknown> = {};
      for (const col of res.columns) {
        plain[col] = (row as Record<string, unknown>)[col] ?? null;
      }
      return plain;
    });
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    tables,
  };
}

async function importSnapshotToDb(db: Client, snapshot: CafeDbSnapshot): Promise<void> {
  const stmts: Array<{ sql: string; args: unknown[] }> = [
    { sql: "DELETE FROM cafe_order_items", args: [] },
    { sql: "DELETE FROM cafe_orders", args: [] },
    { sql: "DELETE FROM cafe_customers", args: [] },
    { sql: "DELETE FROM cafe_ingredients", args: [] },
    { sql: "DELETE FROM cafe_tables", args: [] },
    { sql: "DELETE FROM cafe_toppings", args: [] },
    { sql: "DELETE FROM cafe_menu", args: [] },
    { sql: "DELETE FROM cafe_staff", args: [] },
    { sql: "DELETE FROM cafe_settings", args: [] },
  ];

  for (const tableName of SNAPSHOT_TABLES) {
    const rows = snapshot.tables?.[tableName] ?? [];
    for (const row of rows) {
      const cols = Object.keys(row);
      if (cols.length === 0) continue;
      const placeholders = cols.map(() => "?").join(", ");
      const values = cols.map((c) => row[c] ?? null);
      stmts.push({
        sql: `INSERT INTO ${tableName} (${cols.join(", ")}) VALUES (${placeholders})`,
        args: values,
      });
    }
  }

  await db.batch(stmts as never, "write");
}

export async function persistCafeDbToBlob(): Promise<void> {
  if (!isBlobSyncEnabled()) return;
  const db = getDbClient();
  const snapshot = await exportSnapshotFromDb(db);
  const uploaded = await put(BLOB_STATE_KEY, JSON.stringify(snapshot), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  lastSyncedEtag = uploaded.etag;
}

async function syncFromBlobOrSeed(db: Client): Promise<void> {
  if (!isBlobSyncEnabled()) {
    const staffCount = await db.execute("SELECT COUNT(*) AS cnt FROM cafe_staff");
    if (Number(staffCount.rows[0]?.cnt ?? 0) === 0) {
      await seedCafeDatabase(db);
    }
    return;
  }

  try {
    const remote = await get(BLOB_STATE_KEY, {
      access: "private",
      useCache: false,
    });

    if (remote && remote.statusCode === 200 && remote.stream) {
      if (lastSyncedEtag && remote.blob.etag === lastSyncedEtag) {
        await remote.stream.cancel().catch(() => {});
        return;
      }
      const rawText = await new Response(remote.stream).text();
      const parsed = JSON.parse(rawText) as CafeDbSnapshot;
      if (parsed && parsed.tables) {
        await importSnapshotToDb(db, parsed);
        lastSyncedEtag = remote.blob.etag;
        return;
      }
    }
  } catch {
    // Fallback to local seed if blob read fails transiently
  }

  const staffCount = await db.execute("SELECT COUNT(*) AS cnt FROM cafe_staff");
  if (Number(staffCount.rows[0]?.cnt ?? 0) === 0) {
    await seedCafeDatabase(db);
  }
  await persistCafeDbToBlob();
}

export async function ensureCafeDbReady(): Promise<void> {
  const db = getDbClient();

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await db.batch(
        CAFE_SCHEMA_STATEMENTS.map((sql) => ({ sql, args: [] })),
        "write"
      );
    })();
  }
  await schemaReadyPromise;

  if (!syncInFlight) {
    syncInFlight = syncFromBlobOrSeed(db).finally(() => {
      syncInFlight = null;
    });
  }
  await syncInFlight;
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
  schemaReadyPromise = null;
  lastSyncedEtag = null;

  await db.batch(
    CAFE_SCHEMA_STATEMENTS.map((sql) => ({ sql, args: [] })),
    "write"
  );
  schemaReadyPromise = Promise.resolve();
  await seedCafeDatabase(db);
  await persistCafeDbToBlob();
}
