import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const db = getDb();
  const rows = db.prepare(
    "SELECT name, day, status, content_text, video_url, question, feedback_good, feedback_fix, feedback_next, created_at FROM submissions ORDER BY name, day"
  ).all() as {
    name: string; day: number; status: string; content_text: string;
    video_url: string; question: string; feedback_good: string;
    feedback_fix: string; feedback_next: string; created_at: string;
  }[];

  // CSV 생성
  const headers = ["이름", "Day", "상태", "제출내용", "영상링크", "질문", "잘한점", "수정할점", "다음행동", "제출시간"];
  const csvRows = [headers.join(",")];

  for (const r of rows) {
    const line = [
      r.name,
      `Day${String(r.day).padStart(2, "0")}`,
      r.status,
      `"${(r.content_text || "").replace(/"/g, '""')}"`,
      r.video_url,
      `"${(r.question || "").replace(/"/g, '""')}"`,
      `"${(r.feedback_good || "").replace(/"/g, '""')}"`,
      `"${(r.feedback_fix || "").replace(/"/g, '""')}"`,
      `"${(r.feedback_next || "").replace(/"/g, '""')}"`,
      r.created_at,
    ].join(",");
    csvRows.push(line);
  }

  const BOM = "\uFEFF";
  const csv = BOM + csvRows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=challenge_submissions.csv",
    },
  });
}
