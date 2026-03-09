import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const db = getDb();
  const users = db.prepare("SELECT id, name, role, created_at FROM users ORDER BY created_at DESC").all();

  // 각 학생별 제출 수
  const submissions = db.prepare(
    "SELECT user_id, COUNT(*) as count FROM submissions GROUP BY user_id"
  ).all() as { user_id: number; count: number }[];
  const subMap = new Map(submissions.map((s) => [s.user_id, s.count]));

  const result = (users as { id: number; name: string; role: string; created_at: string }[]).map((u) => ({
    ...u,
    submission_count: subMap.get(u.id) || 0,
  }));

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const db = getDb();
  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(id) as { role: string } | undefined;
  if (user?.role === "admin") {
    return NextResponse.json({ error: "관리자는 삭제할 수 없습니다." }, { status: 400 });
  }

  db.prepare("DELETE FROM submissions WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return NextResponse.json({ message: "삭제 완료" });
}
