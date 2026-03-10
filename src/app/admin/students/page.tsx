"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, apiJson } from "@/lib/api";

interface Student {
  id: number; name: string; role: string; created_at: string; submission_count: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    const user = JSON.parse(stored);
    if (user.role !== "admin") { router.push("/submit"); return; }
    setAuthed(true);
    loadStudents();
  }, [router]);

  async function loadStudents() {
    const res = await apiFetch("/api/users");
    const data = await res.json();
    setStudents(data);
  }

  async function handleResetPassword(id: number, name: string) {
    const newPassword = prompt(`${name}님의 새 비밀번호를 입력하세요 (4자 이상):`);
    if (!newPassword) return;
    if (newPassword.length < 4) { alert("비밀번호는 4자 이상이어야 합니다."); return; }
    const res = await apiJson("/api/users", { method: "PATCH", body: JSON.stringify({ id, newPassword }) });
    const data = await res.json();
    if (res.ok) {
      alert(`${name}님의 비밀번호가 초기화되었습니다.\n새 비밀번호: ${newPassword}`);
    } else {
      alert(data.error || "오류가 발생했습니다.");
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`${name}님을 삭제하시겠습니까? 제출한 과제도 모두 삭제됩니다.`)) return;
    await apiJson("/api/users", { method: "DELETE", body: JSON.stringify({ id }) });
    loadStudents();
  }

  if (!authed) return null;

  const studentList = students.filter((s) => s.role === "student");

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-blue-600 text-sm hover:underline">← 대시보드</Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">학생 관리</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">총 {studentList.length}명</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">제출 수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">가입일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">액션</th>
            </tr>
          </thead>
          <tbody>
            {studentList.map((s) => (
              <tr key={s.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.submission_count}/10</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{s.created_at}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleResetPassword(s.id, s.name)} className="text-blue-500 hover:underline text-xs">비밀번호 초기화</button>
                  <button onClick={() => handleDelete(s.id, s.name)} className="text-red-500 hover:underline text-xs">삭제</button>
                </td>
              </tr>
            ))}
            {studentList.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">가입한 학생이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
