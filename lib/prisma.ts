import { PrismaClient } from "@prisma/client";

// Next.jsの開発環境ではホットリロードのたびに新しいPrismaClientが
// 生成されコネクションが枯渇するため、globalに保持して使い回す定石パターン。

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
