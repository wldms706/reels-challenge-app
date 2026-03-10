"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Lecture {
  id: number;
  title: string;
  description: string;
  video_url: string;
  week: number;
  sort_order: number;
  created_at: string;
}

function getEmbedUrl(url: string): string | null {
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  return null;
}

export default function LecturesPage() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    apiFetch("/api/lectures").then((r) => r.json()).then(setLectures);
  }, [router]);

  if (!user) return null;

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.name}님</p>
        <div className="flex gap-3 text-sm">
          <Link href="/submit" className="text-blue-600 hover:underline">과제 제출</Link>
          <Link href="/my" className="text-blue-600 hover:underline">내 피드백</Link>
          <Link href="/notices" className="text-gray-500 dark:text-gray-400 hover:underline">공지</Link>
          <button onClick={() => { localStorage.removeItem("user"); router.push("/login"); }} className="text-gray-400 hover:underline">로그아웃</button>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-2">강의 다시보기</h1>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">강의 내용이 기억나지 않으면 영상을 다시 확인하세요</p>

      {lectures.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>아직 등록된 강의가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lectures.map((lecture, i) => {
            const embedUrl = getEmbedUrl(lecture.video_url);
            const isPlaying = playingId === lecture.id;

            return (
              <div key={lecture.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
                {isPlaying && embedUrl && (
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                        #{i + 1}
                      </span>
                      <h2 className="font-bold text-sm sm:text-base">{lecture.title}</h2>
                    </div>

                    {embedUrl ? (
                      <button
                        onClick={() => setPlayingId(isPlaying ? null : lecture.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          isPlaying
                            ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isPlaying ? "접기" : "재생"}
                      </button>
                    ) : (
                      <a
                        href={lecture.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        열기
                      </a>
                    )}
                  </div>

                  {lecture.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{lecture.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
