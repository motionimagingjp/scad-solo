"use client";

import { Store, Map as MapIcon, Gamepad2, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ナビ高さは 56px 固定(NAV_HEIGHT)で、他コンポーネントはこの値を基準に配置する。
//
// AI相談タブは廃止した。モードボタンで大半の要望が指定できるようになり、
// 残る自由入力は「今夜の3軒」画面に置く方が「ハズレた直後に相談する」動線に合うため。
// 地図は自分で見渡したい人向けにナビへ戻してある。
// 「ソロ活」タブも廃止し、この枠は「ゲーム」に差し替えた。来店ログはマイページからの
// リンクで十分たどり着け、常設タブにするほどではないと判断したため。
// トップは「おまかせ」表記(シャッフル性は持たせない。エンターテイメント性はゲームタブ側で担う)。
export const NAV_HEIGHT = 56;

const NAV_ITEMS = [
  { href: "/", label: "おまかせ", icon: Store },
  { href: "/map", label: "地図", icon: MapIcon },
  { href: "/games", label: "ゲーム", icon: Gamepad2 },
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
