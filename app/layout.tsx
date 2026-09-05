import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCAD-SOLO",
  description: "今夜のソロ飲みを1秒で決める",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
