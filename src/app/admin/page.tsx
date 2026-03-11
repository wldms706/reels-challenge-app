"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiJson } from "@/lib/api";

interface Submission {
  id: number; name: string; day: number; video_url: string; content_text: string;
  question: string; blog_url: string; status: string; feedback_good: string; feedback_fix: string;
  feedback_next: string; original_filename: string; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  "대기": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "피드백완료": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "재제출요청": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const TASK_MAP: { day: number; code: string; label: string }[] = [
  { day: 1, code: "1-1", label: "릴스 기획" },
  { day: 2, code: "1-2", label: "대본 작성" },
  { day: 3, code: "1-3", label: "릴스 촬영" },
  { day: 4, code: "1-4", label: "릴스 촬영" },
  { day: 5, code: "1-5", label: "촬영본 검토 & 수정" },
  { day: 6, code: "2-1", label: "릴스 편집" },
  { day: 7, code: "2-2", label: "릴스 편집" },
  { day: 8, code: "2-3", label: "랜딩 페이지 작성" },
  { day: 9, code: "2-4", label: "네이버 플레이스 점검" },
  { day: 10, code: "2-5", label: "메타광고 집행" },
];

function getTaskInfo(day: number) {
  return TASK_MAP.find((t) => t.day === day);
}

function getTaskTitle(sub: Submission) {
  const task = getTaskInfo(sub.day);
  return task ? `${task.code} ${task.label} · ${sub.name}` : `Day${String(sub.day).padStart(2, "0")}_${sub.name}`;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filterDay, setFilterDay] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterName, setFilterName] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [feedbackGood, setFeedbackGood] = useState("");
  const [feedbackFix, setFeedbackFix] = useState("");
  const [feedbackNext, setFeedbackNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "matrix">("list");
  const [studentCount, setStudentCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    const user = JSON.parse(stored);
    if (user.role !== "admin") { router.push("/submit"); return; }
    setAuthed(true);

    apiFetch("/api/users").then((r) => r.json()).then((data) => {
      setStudentCount(data.filter((u: { role: string }) => u.role === "student").length);
    });
  }, [router]);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterDay) params.set("day", filterDay);
    if (filterStatus) params.set("status", filterStatus);
    if (filterName) params.set("name", filterName);
    const res = await apiFetch(`/api/submissions?${params}`);
    setSubmissions(await res.json());
  }, [filterDay, filterStatus, filterName]);

  useEffect(() => { if (authed) fetchData(); }, [authed, fetchData]);

  function openFeedback(sub: Submission) {
    setSelected(sub); setFeedbackGood(sub.feedback_good);
    setFeedbackFix(sub.feedback_fix); setFeedbackNext(sub.feedback_next);
  }

  async function saveFeedback(newStatus: string) {
    if (!selected) return;
    setSaving(true);
    await apiJson("/api/feedback", {
      method: "PUT",
      body: JSON.stringify({ id: selected.id, status: newStatus, feedback_good: feedbackGood, feedback_fix: feedbackFix, feedback_next: feedbackNext }),
    });
    setSaving(false); setSelected(null); fetchData();
  }

  async function exportCsv() {
    const res = await apiFetch("/api/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "challenge_submissions.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function logout() { localStorage.removeItem("user"); router.push("/login"); }

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  if (!authed) return null;

  const allNames = [...new Set(submissions.map((s) => s.name))].sort();
  const subMap = new Map<string, Submission>();
  submissions.forEach((s) => subMap.set(`${s.name}_${s.day}`, s));

  const statusCounts = {
    total: submissions.length,
    waiting: submissions.filter((s) => s.status === "대기").length,
    done: submissions.filter((s) => s.status === "피드백완료").length,
    redo: submissions.filter((s) => s.status === "재제출요청").length,
  };

  const submissionRate = studentCount > 0 ? Math.round((allNames.length / studentCount) * 100) : 0;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 pt-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/" className="text-blue-600 text-sm hover:underline">&larr; 홈</Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">관리자 대시보드</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/students" className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            학생 관리
          </Link>
          <Link href="/admin/lectures" className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            강의 관리
          </Link>
          <Link href="/notices" className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            공지사항
          </Link>
          <button onClick={exportCsv} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            CSV 내보내기
          </button>
          <button onClick={toggleTheme} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg">
            Dark/Light
          </button>
          <button onClick={logout} className="text-sm text-gray-400 hover:underline ml-2">로그아웃</button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">전체 제출</p>
          <p className="text-xl sm:text-2xl font-bold">{statusCounts.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 sm:p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">대기</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-800 dark:text-yellow-300">{statusCounts.waiting}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-400">피드백완료</p>
          <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-300">{statusCounts.done}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-400">재제출요청</p>
          <p className="text-xl sm:text-2xl font-bold text-red-800 dark:text-red-300">{statusCounts.redo}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-400">제출률</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-300">{submissionRate}%</p>
          <p className="text-xs text-blue-500 dark:text-blue-400">{allNames.length}/{studentCount}명</p>
        </div>
      </div>

      {/* 필터 + 뷰 전환 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}
          className="border dark:border-gray-600 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
          <option value="">전체 과제</option>
          {TASK_MAP.map((t) => <option key={t.day} value={t.day}>{t.code} {t.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border dark:border-gray-600 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
          <option value="">전체 상태</option>
          <option value="대기">대기</option>
          <option value="피드백완료">피드백완료</option>
          <option value="재제출요청">재제출요청</option>
        </select>
        <input type="text" placeholder="이름 검색" value={filterName} onChange={(e) => setFilterName(e.target.value)}
          className="border dark:border-gray-600 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "list" ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
            목록
          </button>
          <button onClick={() => setView("matrix")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "matrix" ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
            현황표
          </button>
        </div>
      </div>

      {/* 목록 뷰 */}
      {view === "list" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">과제</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden sm:table-cell">유형</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden sm:table-cell">제출시간</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">액션</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium">{getTaskTitle(sub)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {sub.video_url && "영상"}{sub.video_url && sub.content_text && "+"}{sub.content_text && "텍스트"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status]}`}>{sub.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">{sub.created_at}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openFeedback(sub)} className="text-green-600 dark:text-green-400 hover:underline text-xs sm:text-sm">상세/피드백</button>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">제출된 과제가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 매트릭스 뷰 */}
      {view === "matrix" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-x-auto">
          <table className="text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-700 min-w-20">이름</th>
                {TASK_MAP.map((t) => (
                  <th key={t.day} className="px-1.5 py-2 text-center font-medium text-gray-600 dark:text-gray-300 min-w-12" title={t.label}>
                    <div className="text-[10px] leading-tight">{t.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allNames.map((n) => (
                <tr key={n} className="border-b dark:border-gray-700">
                  <td className="px-3 py-2 font-medium sticky left-0 bg-white dark:bg-gray-800 text-xs sm:text-sm">{n}</td>
                  {TASK_MAP.map((t) => {
                    const sub = subMap.get(`${n}_${t.day}`);
                    return (
                      <td key={t.day} className="px-1.5 py-2 text-center">
                        {sub ? (
                          <button onClick={() => openFeedback(sub)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status]}`}
                            title={`${t.label}: ${sub.status}`}>
                            {sub.status === "대기" ? "?" : sub.status === "피드백완료" ? "O" : "X"}
                          </button>
                        ) : <span className="text-gray-200 dark:text-gray-600">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {allNames.length === 0 && (
                <tr><td colSpan={TASK_MAP.length + 1} className="text-center py-8 text-gray-400">제출된 과제가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 피드백 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold">{getTaskTitle(selected)}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {selected.blog_url && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-400 shrink-0">블로그:</span>
                <a href={selected.blog_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">{selected.blog_url}</a>
              </div>
            )}

            {selected.content_text && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">제출 내용</p>
                <p className="text-sm whitespace-pre-wrap">{selected.content_text}</p>
              </div>
            )}

            {selected.video_url && (
              <div className="mb-4">
                {selected.video_url.startsWith("/uploads/") ? (
                  <video src={selected.video_url} controls className="w-full rounded-lg max-h-64 sm:max-h-80" />
                ) : (
                  <a href={selected.video_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    외부 영상 링크 열기 &rarr;
                  </a>
                )}
              </div>
            )}

            {selected.question && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-1 font-medium">질문:</p>
                <p className="text-sm">{selected.question}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-400 mb-1">1) 잘한 점</label>
                <textarea value={feedbackGood} onChange={(e) => setFeedbackGood(e.target.value)}
                  placeholder="잘한 점을 적어주세요"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">2) 수정할 점</label>
                <textarea value={feedbackFix} onChange={(e) => setFeedbackFix(e.target.value)}
                  placeholder="수정할 점을 적어주세요"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">3) 다음 행동</label>
                <textarea value={feedbackNext} onChange={(e) => setFeedbackNext(e.target.value)}
                  placeholder="다음에 할 행동을 적어주세요"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => saveFeedback("피드백완료")} disabled={saving}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition text-sm">
                피드백 완료
              </button>
              <button onClick={() => saveFeedback("재제출요청")} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 transition text-sm">
                재제출 요청
              </button>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition text-sm">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
