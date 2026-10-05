"use server";

import { signIn, signOut } from "@/auth";

export async function loginWithGoogle(redirectTo: string) {
  // 外部URLへのリダイレクトに使われないよう、自サイト内のパスだけを受け付ける
  const safe = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  await signIn("google", { redirectTo: safe });
}

export async function logout() {
  await signOut({ redirectTo: "/mypage" });
}
