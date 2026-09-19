#!/usr/bin/env node
/**
 * Deploy-time database migrator.
 * Skips when DATABASE_URL is not set (preview / no-DB deploys).
 */
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log(
    "[migrate] DATABASE_URL not set — skipping (the PGLite fallback migrates itself).",
  );
  process.exit(0);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }

  if (entries.length === 0) {
    console.log("[migrate] migrations/ is empty — nothing to do.");
    return;
  }

  // Full migration logic requires pg + migration-plan; for now just log.
  console.log(`[migrate] Found ${entries.length} entries in migrations/ — full migrate not yet restored.`);
  console.log("[migrate] Skipping actual DB apply (DATABASE_URL present but migrator simplified).");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
