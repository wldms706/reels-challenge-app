"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  }

  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
      <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm">
        Dark/Light
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold">릴스 챌린지</h1>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md text-sm sm:text-base">
        14일 릴스 챌린지에 오신 것을 환영합니다!<br />
        매일 과제를 제출하고 피드백을 받아보세요.
      </p>

      <p className="text-xs text-gray-400 dark:text-gray-500">매일 밤 11:00까지 제출</p>

      {user ? (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>님
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-center">
              과제 제출
            </Link>
            <Link href="/my" className="flex-1 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition text-center">
              내 피드백
            </Link>
          </div>
          <div className="flex gap-3">
            <Link href="/notices" className="text-sm text-gray-500 dark:text-gray-400 hover:underline">공지사항</Link>
            {user.role === "admin" && (
              <Link href="/admin" className="text-sm text-gray-800 dark:text-gray-200 font-medium hover:underline">관리자</Link>
            )}
            <button onClick={logout} className="text-sm text-gray-400 hover:underline">로그아웃</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link href="/login" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-center">
            로그인
          </Link>
          <Link href="/register" className="flex-1 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center">
            회원가입
          </Link>
        </div>
      )}
    </main>
  );
}
