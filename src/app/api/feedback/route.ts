import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { id, status, feedback_good, feedback_fix, feedback_next } = body;

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다." }, { status: 400 });
  }

  const db = await getDb();
  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (status) { updates.push("status = ?"); args.push(status); }
  if (feedback_good !== undefined) { updates.push("feedback_good = ?"); args.push(feedback_good); }
  if (feedback_fix !== undefined) { updates.push("feedback_fix = ?"); args.push(feedback_fix); }
  if (feedback_next !== undefined) { updates.push("feedback_next = ?"); args.push(feedback_next); }

  if (updates.length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  updates.push("updated_at = datetime('now','localtime')");
  args.push(id);

  await db.execute({ sql: `UPDATE submissions SET ${updates.join(", ")} WHERE id = ?`, args });
  return NextResponse.json({ message: "피드백 저장 완료" });
}
