/** @param {string} name */
export function isMigrationFile(name) {
  return /^\d{14}_[\w-]+\.sql$/.test(name);
}

/** @param {string} name */
export function migrationTimestamp(name) {
  return name.slice(0, 14);
}

/**
 * Sort migration filenames chronologically (by the leading timestamp).
 * @param {string[]} names
 */
export function sortMigrations(names) {
  return [...names].filter(isMigrationFile).sort((a, b) => {
    const ta = migrationTimestamp(a);
    const tb = migrationTimestamp(b);
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
}
