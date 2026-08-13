import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pool, closePool } from "./pool.ts";

const MIGRATIONS_DIR = path.join(import.meta.dirname, "migrations");
const ADVISORY_LOCK_KEY = 727_001;

function checksumOf(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

async function ensureLedger(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      checksum   TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function runMigrations(): Promise<void> {
  await ensureLedger();

  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [ADVISORY_LOCK_KEY]);

    const entries = await readdir(MIGRATIONS_DIR);
    const migrationFiles = entries.filter((entry) => entry.endsWith(".sql")).sort();

    const { rows } = await client.query<{ version: string; checksum: string }>(
      "SELECT version, checksum FROM schema_migrations",
    );
    const applied = new Map(rows.map((row) => [row.version, row.checksum]));

    let appliedCount = 0;

    for (const file of migrationFiles) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      const checksum = checksumOf(sql);
      const previousChecksum = applied.get(file);

      if (previousChecksum !== undefined) {
        if (previousChecksum !== checksum) {
          throw new Error(
            `Migration ${file} was modified after it was applied. Migrations are immutable; add a new migration instead.`,
          );
        }
        continue;
      }

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)", [
          file,
          checksum,
        ]);
        await client.query("COMMIT");
        console.log(`applied ${file}`);
        appliedCount += 1;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`failed to apply ${file}`);
        throw error;
      }
    }

    if (appliedCount === 0) {
      console.log(`Database is up to date (${applied.size} migration${applied.size === 1 ? "" : "s"} applied).`);
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
    client.release();
  }
}

await runMigrations();
await closePool();
