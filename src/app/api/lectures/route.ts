import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user;

  const db = await getDb();
  const week = req.nextUrl.searchParams.get("week");

  let query = "SELECT * FROM lectures";
  const args: number[] = [];

  if (week) {
    query += " WHERE week = ?";
    args.push(Number(week));
  }

  query += " ORDER BY week ASC, sort_order ASC, created_at ASC";
  const result = await db.execute({ sql: query, args });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { title, description, video_url, week, sort_order } = body;

  if (!title || !video_url || !week) {
    return NextResponse.json({ error: "제목, 영상 링크, 주차는 필수입니다." }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.execute({
    sql: "INSERT INTO lectures (title, description, video_url, week, sort_order) VALUES (?, ?, ?, ?, ?)",
    args: [title, description || "", video_url, week, sort_order || 0],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid), message: "강의 등록 완료!" }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "삭제할 강의 ID가 필요합니다." }, { status: 400 });
  }

  const db = await getDb();
  await db.execute({ sql: "DELETE FROM lectures WHERE id = ?", args: [id] });
  return NextResponse.json({ message: "삭제 완료!" });
}
