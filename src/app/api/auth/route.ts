import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, password, action } = await req.json();

  if (!name || !password) {
    return NextResponse.json({ error: "이름과 비밀번호를 입력해주세요." }, { status: 400 });
  }

  const db = getDb();

  if (action === "register") {
    if (password.length < 4) {
      return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
    }
    const existing = db.prepare("SELECT id FROM users WHERE name = ?").get(name);
    if (existing) {
      return NextResponse.json({ error: "이미 등록된 이름입니다." }, { status: 400 });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (name, password) VALUES (?, ?)").run(name, hash);
    return NextResponse.json({ id: result.lastInsertRowid, name, role: "student" });
  }

  // 로그인
  const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name) as {
    id: number;
    name: string;
    password: string;
    role: string;
  } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: "이름 또는 비밀번호가 맞지 않습니다." }, { status: 401 });
  }

  return NextResponse.json({ id: user.id, name: user.name, role: user.role });
}
