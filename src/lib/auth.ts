import { NextRequest, NextResponse } from "next/server";
import getDb from "./db";

interface UserRow {
  id: number;
  name: string;
  role: string;
}

export async function getAuthUser(req: NextRequest): Promise<UserRow | null> {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;

  const db = await getDb();
  const result = await db.execute({ sql: "SELECT id, name, role FROM users WHERE id = ?", args: [Number(userId)] });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { id: Number(row.id), name: String(row.name), role: String(row.role) };
}

export async function requireAuth(req: NextRequest): Promise<UserRow | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<UserRow | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  return result;
}
