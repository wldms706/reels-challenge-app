import { createClient, type Client } from "@libsql/client";
import bcrypt from "bcryptjs";

let client: Client;
let initialized = false;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

async function ensureInit() {
  if (initialized) return;

  const db = getClient();

  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 14),
      video_url TEXT DEFAULT '',
      content_text TEXT DEFAULT '',
      question TEXT DEFAULT '',
      blog_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT '대기' CHECK(status IN ('대기','피드백완료','재제출요청')),
      feedback_good TEXT DEFAULT '',
      feedback_fix TEXT DEFAULT '',
      feedback_next TEXT DEFAULT '',
      original_filename TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT NOT NULL,
      week INTEGER NOT NULL CHECK(week IN (1, 2)),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )`,
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_user_day ON submissions(user_id, day)",
    "CREATE INDEX IF NOT EXISTS idx_sub_day ON submissions(day)",
    "CREATE INDEX IF NOT EXISTS idx_sub_name ON submissions(name)",
    "CREATE INDEX IF NOT EXISTS idx_sub_user ON submissions(user_id)",
  ], "write");

  // 기본 관리자 계정
  const admin = await db.execute("SELECT id FROM users WHERE role = 'admin'");
  if (admin.rows.length === 0) {
    const hash = bcrypt.hashSync("admin1234", 10);
    await db.execute({ sql: "INSERT INTO users (name, password, role) VALUES (?, ?, 'admin')", args: ["관리자", hash] });
  }

  initialized = true;
}

export async function getDb() {
  await ensureInit();
  return getClient();
}

export default getDb;
