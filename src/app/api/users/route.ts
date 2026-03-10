import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const db = await getDb();
  const usersResult = await db.execute("SELECT id, name, role, created_at FROM users ORDER BY created_at DESC");

  const subsResult = await db.execute("SELECT user_id, COUNT(*) as count FROM submissions GROUP BY user_id");
  const subMap = new Map(subsResult.rows.map((s) => [Number(s.user_id), Number(s.count)]));

  const result = usersResult.rows.map((u) => ({
    id: Number(u.id),
    name: String(u.name),
    role: String(u.role),
    created_at: String(u.created_at),
    submission_count: subMap.get(Number(u.id)) || 0,
  }));

  return NextResponse.json(result);
}

// 비밀번호 초기화
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id, newPassword } = await req.json();
  if (!id || !newPassword) return NextResponse.json({ error: "id와 새 비밀번호 필수" }, { status: 400 });
  if (newPassword.length < 4) return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });

  const db = await getDb();
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.execute({ sql: "UPDATE users SET password = ? WHERE id = ?", args: [hash, id] });
  return NextResponse.json({ message: "비밀번호가 초기화되었습니다." });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const db = await getDb();
  const userResult = await db.execute({ sql: "SELECT role FROM users WHERE id = ?", args: [id] });
  if (userResult.rows.length > 0 && String(userResult.rows[0].role) === "admin") {
    return NextResponse.json({ error: "관리자는 삭제할 수 없습니다." }, { status: 400 });
  }

  await db.execute({ sql: "DELETE FROM submissions WHERE user_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
  return NextResponse.json({ message: "삭제 완료" });
}
