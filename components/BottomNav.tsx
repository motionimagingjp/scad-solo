"use client";

import { MapPin, BookImage, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 検索を最優先タブに配置。ナビ高さは 56px 固定(NAV_HEIGHT)で、他コンポーネントはこの値を基準に配置する。
export const NAV_HEIGHT = 56;

const NAV_ITEMS = [
  { href: "/", label: "さがす", icon: MapPin },
  { href: "/logs", label: "ソロ活", icon: BookImage },
  { href: "/chat", label: "AI相談", icon: MessageCircle },
  { href: "/mypage", label: "マイページ", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }} // iPhoneのホームバー領域を避ける
    >
      <div className="mx-auto flex max-w-md justify-around" style={{ height: NAV_HEIGHT }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "text-orange-500" : "text-gray-400"}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
