"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiJson } from "@/lib/api";

interface Lecture {
  id: number;
  title: string;
  description: string;
  video_url: string;
  week: number;
  sort_order: number;
  created_at: string;
}

export default function AdminLecturesPage() {
  const [authed, setAuthed] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    const user = JSON.parse(stored);
    if (user.role !== "admin") { router.push("/submit"); return; }
    setAuthed(true);
  }, [router]);

  useEffect(() => {
    if (authed) fetchLectures();
  }, [authed]);

  async function fetchLectures() {
    const res = await apiFetch("/api/lectures");
    setLectures(await res.json());
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !videoUrl) {
      setMessage("제목과 영상 링크는 필수입니다.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await apiJson("/api/lectures", {
        method: "POST",
        body: JSON.stringify({ title, description, video_url: videoUrl, week: 1, sort_order: sortOrder }),
      });
      if (res.ok) {
        setTitle(""); setDescription(""); setVideoUrl(""); setSortOrder(0);
        setMessage("강의 등록 완료!");
        fetchLectures();
      } else {
        const data = await res.json();
        setMessage(data.error || "등록 실패");
      }
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("이 강의를 삭제하시겠습니까?")) return;
    await apiJson("/api/lectures", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchLectures();
  }

  if (!authed) return null;

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-blue-600 text-sm hover:underline">&larr; 대시보드</Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">강의 영상 관리</h1>
        </div>
        <Link href="/lectures" className="text-sm text-blue-600 hover:underline">학생 화면 보기</Link>
      </div>

      {/* 등록 폼 */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-5 mb-6 space-y-4">
        <h2 className="font-bold text-sm">새 강의 등록</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">제목 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 릴스 기획 강의"
              className="w-full border dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">순서</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full border dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">영상 링크 * (구글 드라이브 or 유튜브)</label>
          <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full border dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
          <p className="text-[11px] text-gray-400 mt-1">
            구글 드라이브: 파일 우클릭 &rarr; 공유 &rarr; &quot;링크가 있는 모든 사용자&quot;로 변경 &rarr; 링크 복사
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">설명 (선택)</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="강의 내용 간단 설명"
            className="w-full border dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition text-sm">
          {saving ? "등록 중..." : "강의 등록"}
        </button>

        {message && (
          <p className={`text-sm ${message.includes("완료") ? "text-green-600" : "text-red-600"}`}>{message}</p>
        )}
      </form>

      {/* 등록된 강의 목록 */}
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">등록된 강의 ({lectures.length}개)</h3>
      {lectures.length === 0 ? (
        <p className="text-xs text-gray-400 py-4">등록된 강의 없음</p>
      ) : (
        <div className="space-y-2">
          {lectures.map((lecture, i) => (
            <div key={lecture.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-3 sm:p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded shrink-0">
                    #{i + 1}
                  </span>
                  <p className="font-medium text-sm truncate">{lecture.title}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{lecture.video_url}</p>
              </div>
              <button onClick={() => handleDelete(lecture.id)}
                className="text-red-500 hover:text-red-700 text-xs ml-3 shrink-0">
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
