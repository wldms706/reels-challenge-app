import { NextRequest, NextResponse } from "next/server";
import getDb from "./db";

interface UserRow {
  id: number;
  name: string;
  role: string;
}

// 간단한 토큰 기반 인증 (userId를 헤더로 전달)
export function getAuthUser(req: NextRequest): UserRow | null {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;

  const db = getDb();
  const user = db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(Number(userId)) as UserRow | undefined;
  return user || null;
}

export function requireAuth(req: NextRequest): UserRow | NextResponse {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return user;
}

export function requireAdmin(req: NextRequest): UserRow | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  return result;
}
