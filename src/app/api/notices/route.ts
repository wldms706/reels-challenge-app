import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user;

  const db = await getDb();
  const result = await db.execute("SELECT * FROM notices ORDER BY created_at DESC");
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({ sql: "INSERT INTO notices (title, content) VALUES (?, ?)", args: [title, content] });
  return NextResponse.json({ id: Number(result.lastInsertRowid), message: "공지 등록 완료" }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const db = await getDb();
  await db.execute({ sql: "DELETE FROM notices WHERE id = ?", args: [id] });
  return NextResponse.json({ message: "삭제 완료" });
}
