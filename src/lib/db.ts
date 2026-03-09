import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data.db");

let db: Database.Database;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS submissions (
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
      );

      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS lectures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        video_url TEXT NOT NULL,
        week INTEGER NOT NULL CHECK(week IN (1, 2)),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_user_day ON submissions(user_id, day);
      CREATE INDEX IF NOT EXISTS idx_sub_day ON submissions(day);
      CREATE INDEX IF NOT EXISTS idx_sub_name ON submissions(name);
      CREATE INDEX IF NOT EXISTS idx_sub_user ON submissions(user_id);
    `);

    // blog_url 컬럼 마이그레이션 (기존 DB 호환)
    const columns = db.prepare("PRAGMA table_info(submissions)").all() as { name: string }[];
    if (!columns.find((c) => c.name === "blog_url")) {
      db.exec("ALTER TABLE submissions ADD COLUMN blog_url TEXT DEFAULT ''");
    }

    // 기본 관리자 계정 (없으면 생성)
    const admin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
    if (!admin) {
      const hash = bcrypt.hashSync("admin1234", 10);
      db.prepare("INSERT INTO users (name, password, role) VALUES (?, ?, 'admin')").run("관리자", hash);
    }
  }
  return db;
}

export default getDb;
