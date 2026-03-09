import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const TASK_CODES: Record<number, string> = {
  1: "1-1", 2: "1-2", 3: "1-3", 4: "1-4", 5: "1-5",
  6: "2-1", 7: "2-2", 8: "2-3", 9: "2-4", 10: "2-5",
};

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user;

  const db = await getDb();
  const day = req.nextUrl.searchParams.get("day");
  const name = req.nextUrl.searchParams.get("name");
  const status = req.nextUrl.searchParams.get("status");
  const userId = req.nextUrl.searchParams.get("userId");

  let query = "SELECT * FROM submissions WHERE 1=1";
  const args: (string | number)[] = [];

  if (user.role !== "admin") {
    query += " AND user_id = ?";
    args.push(user.id);
  } else if (userId) {
    query += " AND user_id = ?";
    args.push(Number(userId));
  }

  if (day) { query += " AND day = ?"; args.push(Number(day)); }
  if (name) { query += " AND name LIKE ?"; args.push(`%${name}%`); }
  if (status) { query += " AND status = ?"; args.push(status); }

  query += " ORDER BY created_at DESC";
  const result = await db.execute({ sql: query, args });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user;

  const formData = await req.formData();
  const day = Number(formData.get("day"));
  const question = (formData.get("question") as string) || "";
  const contentText = (formData.get("contentText") as string) || "";
  const blogUrl = (formData.get("blogUrl") as string) || "";
  const videoLink = formData.get("videoLink") as string | null;

  if (!day || !TASK_CODES[day]) {
    return NextResponse.json({ error: "올바른 과제 항목을 선택해주세요." }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.execute({ sql: "SELECT id FROM submissions WHERE user_id = ? AND day = ?", args: [user.id, day] });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: `WEEK ${TASK_CODES[day]} 과제는 이미 제출했습니다.` }, { status: 400 });
  }

  const videoUrl = videoLink || "";

  if (!videoUrl && !contentText.trim() && !blogUrl.trim()) {
    return NextResponse.json({ error: "영상, 텍스트, 또는 블로그 링크 중 하나는 입력해주세요." }, { status: 400 });
  }

  const result = await db.execute({
    sql: "INSERT INTO submissions (user_id, name, day, video_url, content_text, question, blog_url, original_filename) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [user.id, user.name, day, videoUrl, contentText, question, blogUrl, ""],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid), message: "제출 완료!" }, { status: 201 });
}
