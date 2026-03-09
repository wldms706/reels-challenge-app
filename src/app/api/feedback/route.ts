import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { id, status, feedback_good, feedback_fix, feedback_next } = body;

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다." }, { status: 400 });
  }

  const db = getDb();
  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (status) { updates.push("status = ?"); params.push(status); }
  if (feedback_good !== undefined) { updates.push("feedback_good = ?"); params.push(feedback_good); }
  if (feedback_fix !== undefined) { updates.push("feedback_fix = ?"); params.push(feedback_fix); }
  if (feedback_next !== undefined) { updates.push("feedback_next = ?"); params.push(feedback_next); }

  if (updates.length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  updates.push("updated_at = datetime('now','localtime')");
  params.push(id);

  db.prepare(`UPDATE submissions SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  return NextResponse.json({ message: "피드백 저장 완료" });
}
