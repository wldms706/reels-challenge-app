"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiJson } from "@/lib/api";

interface Notice { id: number; title: string; content: string; created_at: string; }

export default function NoticesPage() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    apiFetch("/api/notices").then((r) => r.json()).then(setNotices);
  }, [router]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiJson("/api/notices", {
      method: "POST",
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      setTitle(""); setContent(""); setShowForm(false);
      const data = await apiFetch("/api/notices").then((r) => r.json());
      setNotices(data);
    }
  }

  async function handleDelete(id: number) {
    await apiJson("/api/notices", { method: "DELETE", body: JSON.stringify({ id }) });
    setNotices(notices.filter((n) => n.id !== id));
  }

  if (!user) return null;

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-blue-600 text-sm hover:underline">← 홈으로</Link>
        {user.role === "admin" && (
          <button onClick={() => setShowForm(!showForm)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            공지 작성
          </button>
        )}
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-6">공지사항</h1>

      {showForm && user.role === "admin" && (
        <form onSubmit={handlePost} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 mb-6 space-y-3">
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" rows={4}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">등록</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm">취소</button>
          </div>
        </form>
      )}

      {notices.length === 0 ? (
        <p className="text-center py-16 text-gray-400">등록된 공지가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div key={n.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 sm:p-5">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold">{n.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{n.created_at}</span>
                  {user.role === "admin" && (
                    <button onClick={() => handleDelete(n.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                  )}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
