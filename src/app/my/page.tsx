"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Submission {
  id: number; name: string; day: number; video_url: string; content_text: string;
  question: string; blog_url: string; status: string; feedback_good: string; feedback_fix: string;
  feedback_next: string; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  "대기": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "피드백완료": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "재제출요청": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const TASK_MAP: { day: number; code: string; label: string; week: number }[] = [
  { day: 1, code: "1-1", label: "릴스 기획", week: 1 },
  { day: 2, code: "1-2", label: "대본 작성", week: 1 },
  { day: 3, code: "1-3", label: "릴스 촬영", week: 1 },
  { day: 4, code: "1-4", label: "릴스 촬영", week: 1 },
  { day: 5, code: "1-5", label: "촬영본 검토 & 수정", week: 1 },
  { day: 6, code: "2-1", label: "릴스 편집", week: 2 },
  { day: 7, code: "2-2", label: "릴스 편집", week: 2 },
  { day: 8, code: "2-3", label: "랜딩 페이지 작성", week: 2 },
  { day: 9, code: "2-4", label: "네이버 플레이스 점검", week: 2 },
  { day: 10, code: "2-5", label: "메타광고 집행", week: 2 },
];

function getTaskInfo(day: number) {
  return TASK_MAP.find((t) => t.day === day);
}

export default function MyPage() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    apiFetch(`/api/submissions?userId=${u.id}`).then((r) => r.json()).then(setSubmissions);
  }, [router]);

  if (!user) return null;

  const submittedDays = new Set(submissions.map((s) => s.day));
  const completedCount = submissions.filter((s) => s.status === "피드백완료").length;
  const totalTasks = TASK_MAP.length;

  const week1Tasks = TASK_MAP.filter((t) => t.week === 1);
  const week2Tasks = TASK_MAP.filter((t) => t.week === 2);

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.name}님</p>
        <div className="flex gap-3 text-sm">
          <Link href="/submit" className="text-blue-600 hover:underline">과제 제출</Link>
          <Link href="/lectures" className="text-blue-600 hover:underline">강의 다시보기</Link>
          <Link href="/notices" className="text-gray-500 dark:text-gray-400 hover:underline">공지</Link>
          <button onClick={() => { localStorage.removeItem("user"); router.push("/login"); }} className="text-gray-400 hover:underline">로그아웃</button>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-4">내 피드백</h1>

      {/* 제출 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium">제출 현황</p>
          <p className="text-xs text-gray-400">{submittedDays.size}/{totalTasks}개 제출 | {completedCount}개 완료</p>
        </div>

        {/* WEEK 1 */}
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">WEEK 1 · 릴스 기획 & 촬영</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {week1Tasks.map((task) => {
            const sub = submissions.find((s) => s.day === task.day);
            const color = !sub
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400"
              : sub.status === "피드백완료"
              ? "bg-green-500 text-white"
              : sub.status === "재제출요청"
              ? "bg-red-500 text-white"
              : "bg-yellow-400 text-white";
            return (
              <div key={task.day} className={`h-9 px-2.5 rounded-lg flex items-center justify-center text-[11px] font-medium ${color}`} title={task.label}>
                {task.code}
              </div>
            );
          })}
        </div>

        {/* WEEK 2 */}
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">WEEK 2 · 편집 & 광고 세팅</p>
        <div className="flex gap-1.5 flex-wrap">
          {week2Tasks.map((task) => {
            const sub = submissions.find((s) => s.day === task.day);
            const color = !sub
              ? "bg-gray-100 dark:bg-gray-700 text-gray-400"
              : sub.status === "피드백완료"
              ? "bg-green-500 text-white"
              : sub.status === "재제출요청"
              ? "bg-red-500 text-white"
              : "bg-yellow-400 text-white";
            return (
              <div key={task.day} className={`h-9 px-2.5 rounded-lg flex items-center justify-center text-[11px] font-medium ${color}`} title={task.label}>
                {task.code}
              </div>
            );
          })}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>아직 제출한 과제가 없습니다.</p>
          <Link href="/submit" className="text-blue-600 hover:underline mt-2 inline-block">과제 제출하러 가기</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const task = getTaskInfo(sub.day);
            return (
              <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                      {task ? task.code : `Day ${sub.day}`}
                    </span>
                    <h2 className="font-bold text-sm">{task ? task.label : `Day ${String(sub.day).padStart(2, "0")}`}</h2>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status]}`}>{sub.status}</span>
                </div>

                {sub.blog_url && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 shrink-0">블로그:</span>
                    <a href={sub.blog_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">{sub.blog_url}</a>
                  </div>
                )}

                {sub.content_text && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">제출 내용</p>
                    <p className="text-sm whitespace-pre-wrap">{sub.content_text}</p>
                  </div>
                )}

                {sub.video_url && (
                  <div className="mb-3">
                    {sub.video_url.startsWith("/uploads/") ? (
                      <video src={sub.video_url} controls className="w-full rounded-lg max-h-60" />
                    ) : (
                      <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">영상 링크 보기</a>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-3">{sub.created_at}</p>

                {sub.status !== "대기" && (sub.feedback_good || sub.feedback_fix || sub.feedback_next) ? (
                  <div className="border-t dark:border-gray-700 pt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">피드백</p>
                    {sub.feedback_good && <div className="flex gap-2 text-sm"><span className="text-green-600 dark:text-green-400 font-medium shrink-0">잘한 점:</span><span>{sub.feedback_good}</span></div>}
                    {sub.feedback_fix && <div className="flex gap-2 text-sm"><span className="text-orange-600 dark:text-orange-400 font-medium shrink-0">수정할 점:</span><span>{sub.feedback_fix}</span></div>}
                    {sub.feedback_next && <div className="flex gap-2 text-sm"><span className="text-blue-600 dark:text-blue-400 font-medium shrink-0">다음 행동:</span><span>{sub.feedback_next}</span></div>}
                  </div>
                ) : sub.status === "대기" ? (
                  <div className="border-t dark:border-gray-700 pt-3"><p className="text-sm text-gray-400">피드백 대기 중...</p></div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
