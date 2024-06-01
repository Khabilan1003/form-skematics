import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { sql } from "drizzle-orm";

const sqlite = new Database("./database/sqlite.db");
export const db = drizzle(sqlite);

db.run(sql`PRAGMA foreign_keys = ON`);
