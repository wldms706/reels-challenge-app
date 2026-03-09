import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const db = getDb();
  const week = req.nextUrl.searchParams.get("week");

  let query = "SELECT * FROM lectures";
  const params: number[] = [];

  if (week) {
    query += " WHERE week = ?";
    params.push(Number(week));
  }

  query += " ORDER BY week ASC, sort_order ASC, created_at ASC";
  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { title, description, video_url, week, sort_order } = body;

  if (!title || !video_url || !week) {
    return NextResponse.json({ error: "제목, 영상 링크, 주차는 필수입니다." }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare("INSERT INTO lectures (title, description, video_url, week, sort_order) VALUES (?, ?, ?, ?, ?)")
    .run(title, description || "", video_url, week, sort_order || 0);

  return NextResponse.json({ id: result.lastInsertRowid, message: "강의 등록 완료!" }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "삭제할 강의 ID가 필요합니다." }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM lectures WHERE id = ?").run(id);
  return NextResponse.json({ message: "삭제 완료!" });
}
