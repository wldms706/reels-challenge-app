import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const db = getDb();
  const notices = db.prepare("SELECT * FROM notices ORDER BY created_at DESC").all();
  return NextResponse.json(notices);
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("INSERT INTO notices (title, content) VALUES (?, ?)").run(title, content);
  return NextResponse.json({ id: result.lastInsertRowid, message: "공지 등록 완료" }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM notices WHERE id = ?").run(id);
  return NextResponse.json({ message: "삭제 완료" });
}
