import Link from "next/link";
import { APP_ABOUT } from "@/lib/data/about";

// ヘッダーに置く「このアプリについて」導線。SCAD-BEAUTYに合わせ、汎用のiマークではなく
// 開発者アバターをそのままボタンにしている。
export default function InfoButton() {
  return (
    <Link
      href="/about"
      aria-label="このアプリについて"
      className="flex h-8.5 w-8.5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200"
      style={{ width: 34, height: 34 }}
    >
      <img src={APP_ABOUT.avatarImage} alt="" className="h-full w-full object-cover" />
    </Link>
  );
}
