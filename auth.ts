import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Auth.js(NextAuth v5)の設定。AUTH_SECRET / AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET は環境変数から自動で読まれる。
// middlewareは使わない(Edge RuntimeでPrismaが動かないため)。ログイン確認は各APIとページで auth() を呼んで行う。
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "database" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
