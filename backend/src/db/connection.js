// Pure-Node SQLite via the built-in `node:sqlite` module (stable in Node 24+).
// Exposes a small better-sqlite3-compatible facade so the rest of the
// codebase doesn't need to change.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(process.cwd(), process.env.DB_PATH || './data/app.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const raw = new DatabaseSync(dbPath);
raw.exec('PRAGMA journal_mode = WAL');
raw.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
raw.exec(schema);

// Convert BigInt → Number when safe (SQLite ids fit in 53 bits in practice).
const toNum = (v) => (typeof v === 'bigint' ? Number(v) : v);
const fixRow = (row) => {
  if (!row || typeof row !== 'object') return row;
  for (const k of Object.keys(row)) row[k] = toNum(row[k]);
  return row;
};

function wrapStatement(stmt) {
  return {
    run: (...args) => {
      const r = stmt.run(...args);
      return { changes: toNum(r.changes), lastInsertRowid: toNum(r.lastInsertRowid) };
    },
    get: (...args) => fixRow(stmt.get(...args)),
    all: (...args) => stmt.all(...args).map(fixRow),
    iterate: (...args) => stmt.iterate(...args),
  };
}

export const db = {
  prepare: (sql) => wrapStatement(raw.prepare(sql)),
  exec: (sql) => raw.exec(sql),
  // Minimal transaction() helper compatible with better-sqlite3 usage.
  transaction: (fn) => (...args) => {
    raw.exec('BEGIN');
    try {
      const result = fn(...args);
      raw.exec('COMMIT');
      return result;
    } catch (err) {
      raw.exec('ROLLBACK');
      throw err;
    }
  },
  close: () => raw.close(),
};

export default db;
