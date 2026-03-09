"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const STEPS = [
  { img: "/guide/step1.png", title: "1. 구글 크롬에서 Google 접속", desc: "구글 크롬 브라우저를 열어주세요." },
  { img: "/guide/step2.png", title: "2. 구글 앱에서 '드라이브' 클릭", desc: "오른쪽 상단 점 9개 아이콘을 누르면 앱 목록이 나옵니다. '드라이브'를 클릭하세요." },
  { img: "/guide/step3.png", title: "3. 왼쪽 '+ 신규' 버튼 클릭", desc: "드라이브 왼쪽 메뉴에서 '+ 신규' 버튼을 클릭합니다." },
  { img: "/guide/step4.png", title: "4. '새 폴더' 선택", desc: "과제를 정리할 폴더를 먼저 만들어줍니다." },
  { img: "/guide/step5.png", title: "5. 폴더 이름을 '릴스 과제'로 입력", desc: "폴더 이름을 입력하고 '만들기'를 클릭하세요." },
  { img: "/guide/step6.png", title: "6. 폴더 안에 파일 드래그 앤 드롭", desc: "만든 폴더에 들어가서, 촬영한 동영상 파일을 드래그해서 올려주세요." },
  { img: "/guide/step7.png", title: "7. 또는 '+ 신규 → 파일 업로드' 클릭", desc: "드래그가 안 되면 '+ 신규' → '파일 업로드'로도 올릴 수 있습니다." },
  { img: "/guide/step8.png", title: "8. 업로드 완료!", desc: "이렇게 파일들이 올라가면 됩니다." },
  { img: "/guide/step9.png", title: "9. 폴더 이름 옆 사람 모양 아이콘 클릭", desc: "공유 설정을 위해 파일 이름 옆의 사람 모양 아이콘을 클릭하세요." },
  { img: "/guide/step10.png", title: "10. 공유 버튼 클릭", desc: "공유 설정 화면이 나타납니다." },
  { img: "/guide/step11.png", title: "11. '링크가 있는 모든 사용자'로 변경", desc: "'일반 액세스'를 '링크가 있는 모든 사용자'로 변경하고, 권한도 확인해주세요." },
  { img: "/guide/step12.png", title: "12. '댓글 작성자' 또는 '편집자' 선택", desc: "'댓글 작성자'로 하면 댓글만 달 수 있고, '편집자'로 하면 파일 추가/수정도 가능합니다. 둘 중 편한 걸로 선택하세요." },
  { img: "/guide/step13.png", title: "13. '링크 복사' 클릭!", desc: "링크 복사 버튼을 누르면 끝! 이 링크를 과제 제출 페이지에 붙여넣기 하세요." },
];

export default function GuidePage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  if (!user) return null;

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.name}님</p>
        <div className="flex gap-3 text-sm">
          <Link href="/submit" className="text-blue-600 hover:underline">과제 제출</Link>
          <Link href="/lectures" className="text-blue-600 hover:underline">강의</Link>
          <Link href="/notices" className="text-gray-500 dark:text-gray-400 hover:underline">공지</Link>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-2">구글 드라이브 사용 가이드</h1>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">과제 영상을 구글 드라이브에 올리고 링크를 제출하는 방법입니다 (무료)</p>

      <div className="space-y-8">
        {STEPS.map((step, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
            <div className="relative w-full">
              <Image
                src={step.img}
                alt={step.title}
                width={800}
                height={500}
                className="w-full h-auto"
                unoptimized
              />
            </div>
            <div className="p-4">
              <h2 className="font-bold text-sm sm:text-base mb-1">{step.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 마무리 안내 */}
      <div className="mt-8 mb-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
        <h3 className="font-bold text-sm text-blue-900 dark:text-blue-200 mb-2">링크 복사 후 과제 제출하기</h3>
        <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>위 과정을 따라 구글 드라이브 링크를 복사하세요</li>
          <li><Link href="/submit" className="underline font-medium">과제 제출 페이지</Link>로 이동하세요</li>
          <li>해당 주차/과제를 선택하고 링크를 붙여넣기 하세요</li>
          <li>제출 버튼을 누르면 완료!</li>
        </ol>
      </div>
    </main>
  );
}
