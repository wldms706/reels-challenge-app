"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiForm } from "@/lib/api";

interface User { id: number; name: string; role: string; }

interface Task {
  day: number;
  code: string;
  label: string;
  placeholder: string;
}

interface Week {
  id: number;
  badge: string;
  title: string;
  date: string;
  tasks: Task[];
}

const WEEKS: Week[] = [
  {
    id: 1,
    badge: "WEEK 1",
    title: "릴스 기획 & 촬영",
    date: "3월 11일 ~ 17일",
    tasks: [
      { day: 1, code: "1-1", label: "릴스 기획", placeholder: "릴스 콘셉트, 타겟, 참고 영상 등을 적어주세요" },
      { day: 2, code: "1-2", label: "대본 작성", placeholder: "릴스 대본 내용을 적어주세요 (후킹, 본문, CTA 등)" },
      { day: 3, code: "1-3", label: "릴스 촬영", placeholder: "촬영할 장면, 촬영 장소, 소요 시간 등을 적어주세요" },
      { day: 4, code: "1-4", label: "릴스 촬영", placeholder: "촬영한 장면 설명, 촬영 장소, 소요 시간 등을 적어주세요" },
      { day: 5, code: "1-5", label: "촬영본 검토 & 수정", placeholder: "촬영본 검토 결과, 수정 사항 등을 적어주세요" },
    ],
  },
  {
    id: 2,
    badge: "WEEK 2",
    title: "편집 & 광고 세팅",
    date: "3월 18일 ~ 24일",
    tasks: [
      { day: 6, code: "2-1", label: "릴스 편집", placeholder: "편집 툴, 편집 포인트, 음악/자막 등을 적어주세요" },
      { day: 7, code: "2-2", label: "릴스 편집", placeholder: "편집 마무리, 자막/효과 추가 등을 적어주세요" },
      { day: 8, code: "2-3", label: "랜딩 페이지 작성", placeholder: "랜딩 페이지 URL과 구성 내용을 적어주세요" },
      { day: 9, code: "2-4", label: "네이버 플레이스 점검", placeholder: "점검한 내용과 수정 사항을 적어주세요" },
      { day: 10, code: "2-5", label: "메타광고 집행", placeholder: "광고 타겟, 예산, 소재 등을 적어주세요" },
    ],
  },
];

const ALL_TASKS = WEEKS.flatMap((w) => w.tasks.map((t) => ({ ...t, weekId: w.id, weekBadge: w.badge })));

export default function SubmitPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedTaskCode, setSelectedTaskCode] = useState("");
  const [question, setQuestion] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [contentText, setContentText] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const currentWeek = WEEKS.find((w) => w.id === selectedWeek)!;
  const selectedTask = ALL_TASKS.find((t) => t.code === selectedTaskCode);

  function handleWeekChange(weekId: number) {
    setSelectedWeek(weekId);
    setSelectedTaskCode("");
  }

  function logout() { localStorage.removeItem("user"); router.push("/login"); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedTask) {
      setResult({ success: false, message: "과제 항목을 선택해주세요." });
      return;
    }
    setSubmitting(true);
    setResult(null);

    const taskTag = `[WEEK ${selectedTask.code} - ${selectedTask.label}]\n`;
    const fullContent = taskTag + contentText;

    const formData = new FormData();
    formData.append("day", String(selectedTask.day));
    formData.append("question", question);
    formData.append("contentText", fullContent);
    formData.append("blogUrl", blogUrl);

    if (videoLink) {
      formData.append("videoLink", videoLink);
    }

    if (!videoLink && !contentText.trim() && !blogUrl.trim()) {
      setResult({ success: false, message: "영상, 링크, 텍스트, 또는 블로그 링크 중 하나는 입력해주세요." });
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiForm("/api/submissions", formData);
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `WEEK ${selectedTask.code} 제출 완료! 피드백을 기다려주세요.` });
        setQuestion(""); setVideoLink(""); setContentText(""); setBlogUrl(""); setSelectedTaskCode("");
      } else {
        setResult({ success: false, message: data.error || "제출에 실패했습니다." });
      }
    } catch {
      setResult({ success: false, message: "네트워크 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>님
        </p>
        <div className="flex gap-3 text-sm">
          <Link href="/my" className="text-blue-600 hover:underline">내 피드백</Link>
          <Link href="/lectures" className="text-blue-600 hover:underline">강의 다시보기</Link>
          <Link href="/notices" className="text-gray-500 dark:text-gray-400 hover:underline">공지</Link>
          <button onClick={logout} className="text-gray-400 hover:underline">로그아웃</button>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-2">과제 제출</h1>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        10일 챌린지 · 과제 항목별 1회 제출 · 매일 블로그 링크 필수 ·{" "}
        <Link href="/guide" className="text-blue-500 hover:underline">구글 드라이브 사용법</Link>
      </p>

      {/* 주차 선택 탭 */}
      <div className="flex gap-2 mb-6">
        {WEEKS.map((week) => (
          <button
            key={week.id}
            type="button"
            onClick={() => handleWeekChange(week.id)}
            className={`flex-1 py-3 rounded-lg border text-center transition ${
              selectedWeek === week.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
          >
            <p className="text-xs font-bold tracking-wider">{week.badge}</p>
            <p className="text-[11px] mt-0.5 opacity-70">{week.title}</p>
            <p className="text-[10px] mt-0.5 opacity-50">{week.date}</p>
          </button>
        ))}
      </div>

      {/* 과제 항목 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">과제 항목 선택 *</label>
        <div className="grid grid-cols-1 gap-2">
          {currentWeek.tasks.map((task) => (
            <button
              key={task.code}
              type="button"
              onClick={() => setSelectedTaskCode(task.code)}
              className={`w-full text-left px-4 py-3.5 rounded-lg border transition ${
                selectedTaskCode === task.code
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  selectedTaskCode === task.code
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                }`}>
                  {task.code}
                </span>
                <span className="text-sm font-medium">{task.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 과제가 있을 때만 입력 폼 표시 */}
      {selectedTask && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 선택된 과제 뱃지 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded">WEEK {selectedTask.code}</span>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedTask.label}</span>
          </div>

          {/* 블로그 링크 (매일 필수) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              오늘의 블로그 링크 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1">(매일 블로그 글쓰기)</span>
            </label>
            <input
              type="url"
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              placeholder="https://blog.naver.com/..."
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 과제 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">과제 내용</label>
            <textarea value={contentText} onChange={(e) => setContentText(e.target.value)}
              placeholder={selectedTask.placeholder}
              rows={6}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
          </div>

          {/* 영상/파일 링크 제출 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              영상/파일 링크 (선택)
              <span className="text-xs text-gray-400 ml-1">구글 드라이브 or 유튜브</span>
            </label>
            <input type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">
              사용법을 모르면 <a href="/guide" className="text-blue-500 hover:underline">구글 드라이브 가이드</a>를 확인하세요
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">질문 (선택)</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="궁금한 점이 있으면 적어주세요" rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition">
            {submitting ? "제출 중..." : `WEEK ${selectedTask.code} 제출하기`}
          </button>

          {result && (
            <div className={`p-4 rounded-lg text-sm ${result.success ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
              {result.message}
            </div>
          )}
        </form>
      )}

      {/* 결과 메시지 (과제 미선택 시에도 표시) */}
      {!selectedTask && result && (
        <div className={`p-4 rounded-lg text-sm ${result.success ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
          {result.message}
        </div>
      )}
    </main>
  );
}
