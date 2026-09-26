import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `利用規約 | ${BRAND.appName}` };

// 【ドラフト】法務文言はオーナー確認前の暫定版。内容は事業者(Jake)の確認・修正待ち
export default function TermsPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50 pb-10">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/mypage" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">利用規約</h1>
      </header>

      <div className="space-y-5 px-4 py-6 text-sm leading-relaxed text-gray-700">
        <p className="text-xs text-gray-400">最終更新日: 2026年9月26日</p>

        <section>
          <h2 className="font-bold">第1条（適用）</h2>
          <p className="mt-1">
            本規約は、{BRAND.appName}（以下「本サービス」）の利用条件を定めるものです。利用者は本規約に同意のうえ本サービスを利用するものとします。
          </p>
        </section>

        <section>
          <h2 className="font-bold">第2条（アカウント）</h2>
          <p className="mt-1">
            お気に入り・「行った！」記録などの機能を利用する場合、Googleアカウントによるログインが必要です。閲覧のみであればログインは不要です。
          </p>
        </section>

        <section>
          <h2 className="font-bold">第3条（禁止事項）</h2>
          <p className="mt-1">利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>法令または公序良俗に違反する行為</li>
            <li>事実と異なる投稿、他者の迷惑となる投稿を行う行為</li>
            <li>他の利用者や店舗に不利益・損害を与える行為</li>
            <li>本サービスの運営を妨害する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold">第4条（投稿コンテンツ）</h2>
          <p className="mt-1">
            利用者が投稿した写真・コメント等は、運営が不適切と判断した場合、事前の通知なく非表示・削除することがあります。
          </p>
        </section>

        <section>
          <h2 className="font-bold">第5条（免責事項）</h2>
          <p className="mt-1">
            本サービスに掲載する店舗情報の正確性について万全を期しておりますが、内容を保証するものではありません。本サービスの利用により生じた損害について、運営は責任を負わないものとします。
          </p>
        </section>

        <section>
          <h2 className="font-bold">第6条（規約の変更）</h2>
          <p className="mt-1">運営は、必要と判断した場合、利用者への事前通知なく本規約を変更できるものとします。</p>
        </section>

        <p className="pt-4 text-xs text-gray-400">
          お問い合わせは
          <Link href="/about" className="text-orange-500 underline underline-offset-2">
            このアプリについて
          </Link>
          のページよりご連絡ください。
        </p>
      </div>
    </div>
  );
}
