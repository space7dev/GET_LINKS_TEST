import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { migrations } from './migrations.js';

export type SqliteDatabase = Database.Database;

export function createDatabase(databasePath: string): SqliteDatabase {
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(resolve(databasePath)), { recursive: true });
  }

  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');

  if (databasePath !== ':memory:') {
    database.pragma('journal_mode = WAL');
  }

  runMigrations(database);
  return database;
}

function runMigrations(database: SqliteDatabase): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedVersions = new Set(
    database
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((row) => (row as { version: number }).version),
  );

  const applyMigration = database.transaction(
    (migration: (typeof migrations)[number]) => {
      database.exec(migration.sql);
      database
        .prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
        .run(migration.version, migration.name, new Date().toISOString());
    },
  );

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) applyMigration(migration);
  }
}
