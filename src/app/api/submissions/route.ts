import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import getDb from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const TASK_CODES: Record<number, string> = {
  1: "1-1", 2: "1-2", 3: "1-3", 4: "1-4", 5: "1-5",
  6: "2-1", 7: "2-2", 8: "2-3", 9: "2-4", 10: "2-5",
};

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const db = getDb();
  const day = req.nextUrl.searchParams.get("day");
  const name = req.nextUrl.searchParams.get("name");
  const status = req.nextUrl.searchParams.get("status");
  const userId = req.nextUrl.searchParams.get("userId");

  let query = "SELECT * FROM submissions WHERE 1=1";
  const params: (string | number)[] = [];

  // 학생은 본인 것만 조회 가능
  if (user.role !== "admin") {
    query += " AND user_id = ?";
    params.push(user.id);
  } else if (userId) {
    query += " AND user_id = ?";
    params.push(Number(userId));
  }

  if (day) { query += " AND day = ?"; params.push(Number(day)); }
  if (name) { query += " AND name LIKE ?"; params.push(`%${name}%`); }
  if (status) { query += " AND status = ?"; params.push(status); }

  query += " ORDER BY created_at DESC";
  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const formData = await req.formData();
  const day = Number(formData.get("day"));
  const question = (formData.get("question") as string) || "";
  const contentText = (formData.get("contentText") as string) || "";
  const blogUrl = (formData.get("blogUrl") as string) || "";
  const file = formData.get("video") as File | null;
  const videoLink = formData.get("videoLink") as string | null;

  if (!day || !TASK_CODES[day]) {
    return NextResponse.json({ error: "올바른 과제 항목을 선택해주세요." }, { status: 400 });
  }

  // 중복 제출 체크
  const db = getDb();
  const existing = db.prepare("SELECT id FROM submissions WHERE user_id = ? AND day = ?").get(user.id, day);
  if (existing) {
    return NextResponse.json({ error: `WEEK ${TASK_CODES[day]} 과제는 이미 제출했습니다.` }, { status: 400 });
  }

  let videoUrl = "";
  let originalFilename = "";

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "파일 크기는 100MB 이하만 가능합니다." }, { status: 400 });
    }
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const ext = path.extname(file.name) || ".mp4";
    const safeName = user.name.replace(/[^가-힣a-zA-Z0-9]/g, "");
    const timestamp = Date.now();
    const filename = `Day${String(day).padStart(2, "0")}_${safeName}_릴스_${timestamp}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    videoUrl = `/uploads/${filename}`;
    originalFilename = file.name;
  } else if (videoLink) {
    videoUrl = videoLink;
  }

  if (!videoUrl && !contentText.trim() && !blogUrl.trim()) {
    return NextResponse.json({ error: "영상, 텍스트, 또는 블로그 링크 중 하나는 입력해주세요." }, { status: 400 });
  }

  const result = db
    .prepare("INSERT INTO submissions (user_id, name, day, video_url, content_text, question, blog_url, original_filename) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(user.id, user.name, day, videoUrl, contentText, question, blogUrl, originalFilename);

  return NextResponse.json({ id: result.lastInsertRowid, message: "제출 완료!" }, { status: 201 });
}
