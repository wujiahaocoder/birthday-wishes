import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const directory = process.env.BIRTHDAY_DATA_DIR || path.join(process.cwd(), "data");
mkdirSync(directory, { recursive: true });
const database = new DatabaseSync(path.join(directory, "birthday.sqlite"));
database.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
database.exec("CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
for (const file of readdirSync(path.join(process.cwd(), "drizzle")).filter(file => file.endsWith(".sql")).sort()) {
  if (database.prepare("SELECT name FROM _local_migrations WHERE name = ?").get(file)) continue;
  database.exec("BEGIN IMMEDIATE");
  try {
    database.exec(readFileSync(path.join(process.cwd(), "drizzle", file), "utf8"));
    database.prepare("INSERT INTO _local_migrations (name, applied_at) VALUES (?, ?)").run(file, new Date().toISOString());
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

// D1-compatible prepared statements keep local and hosted routes identical.
class Statement {
  constructor(sql, args = []) { this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.sql, args); }
  async raw() { const statement = database.prepare(this.sql); statement.setReturnArrays(true); return statement.all(...this.args); }
  async all() { return { success: true, results: database.prepare(this.sql).all(...this.args), meta: {} }; }
  async first(column) { const row = database.prepare(this.sql).get(...this.args); return column ? row?.[column] ?? null : row ?? null; }
  async run() { const info = database.prepare(this.sql).run(...this.args); return { success: true, results: [], meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) } }; }
}
export const env = { DB: { prepare: sql => new Statement(sql), async batch(statements) {
  database.exec("BEGIN IMMEDIATE");
  try { const results = []; for (const statement of statements) results.push(await statement.all()); database.exec("COMMIT"); return results; }
  catch (error) { database.exec("ROLLBACK"); throw error; }
} } };
export function closeDb() { database.close(); }
