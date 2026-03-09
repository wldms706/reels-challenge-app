import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, password, action } = await req.json();

  if (!name || !password) {
    return NextResponse.json({ error: "이름과 비밀번호를 입력해주세요." }, { status: 400 });
  }

  const db = await getDb();

  if (action === "register") {
    if (password.length < 4) {
      return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
    }
    const existing = await db.execute({ sql: "SELECT id FROM users WHERE name = ?", args: [name] });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "이미 등록된 이름입니다." }, { status: 400 });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = await db.execute({ sql: "INSERT INTO users (name, password) VALUES (?, ?)", args: [name, hash] });
    return NextResponse.json({ id: Number(result.lastInsertRowid), name, role: "student" });
  }

  // 로그인
  const userResult = await db.execute({ sql: "SELECT * FROM users WHERE name = ?", args: [name] });
  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: "이름 또는 비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  const user = userResult.rows[0];
  if (!bcrypt.compareSync(password, String(user.password))) {
    return NextResponse.json({ error: "이름 또는 비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  return NextResponse.json({ id: Number(user.id), name: String(user.name), role: String(user.role) });
}
