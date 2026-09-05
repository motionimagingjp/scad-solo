import type { NextRequest } from "next/server";

// 【暫定】userId はリクエストbodyではなく、ここで一元的に取り出す。
// 現状は x-user-id ヘッダを読むだけの仮実装。認証(NextAuth等)導入時はこの関数の中身だけ差し替える。
// 将来SCAD共通アカウント(SSO)にする場合もここが差し替えポイントになる。
export function getUserIdFromRequest(req: NextRequest): string | null {
  return req.headers.get("x-user-id");
}
