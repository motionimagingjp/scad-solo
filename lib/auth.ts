import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// 来店ログ(VisitLog)・実績の記録先ユーザーIDを決める。
// Googleログイン中はそのユーザーID、未ログインなら従来どおり x-user-id ヘッダ(本番 demo-user / デモ mirai-demo-user)。
// ヘッダは誰でも書き換えられるので、暫定IDだけを受け付ける(実ユーザーのIDを名乗って他人のログを操作させないため)。
const ANONYMOUS_USER_IDS = new Set(["demo-user", "mirai-demo-user"]);

export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  const headerId = req.headers.get("x-user-id");
  return headerId && ANONYMOUS_USER_IDS.has(headerId) ? headerId : null;
}

/** お気に入り・「行った！」など、Googleログイン必須の書き込みAPI用。未ログインなら null */
export async function getLoggedInUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
