import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `プライバシーポリシー | ${BRAND.appName}` };

// 【ドラフト】法務文言はオーナー確認前の暫定版。内容は事業者(Jake)の確認・修正待ち
export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50 pb-10">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/mypage" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">プライバシーポリシー</h1>
      </header>

      <div className="space-y-5 px-4 py-6 text-sm leading-relaxed text-gray-700">
        <p className="text-xs text-gray-400">最終更新日: 2026年9月26日</p>

        <section>
          <h2 className="font-bold">1. 取得する情報</h2>
          <p className="mt-1">本サービスは、以下の情報を取得します。</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              <strong>Googleログインで取得する情報</strong>: 氏名、メールアドレス、プロフィール画像（Googleアカウントの基本情報のみ。パスワード等は取得しません）
            </li>
            <li>
              <strong>利用状況</strong>: お気に入り登録した店舗、「行った！」の記録、来店ログ・コメント・投稿写真（投稿機能利用時）
            </li>
            <li>
              <strong>位置情報</strong>: 近くの店舗を探すために、ブラウザの位置情報機能（利用者が許可した場合のみ）またはIPアドレスから推定した大まかな位置
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold">2. 利用目的</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>ログイン状態の維持、お気に入り・来店記録の管理</li>
            <li>現在地に基づく店舗検索・提案</li>
            <li>サービス改善のための統計的な分析（個人を特定しない形式）</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold">3. 第三者提供</h2>
          <p className="mt-1">法令に基づく場合を除き、取得した情報を本人の同意なく第三者に提供することはありません。</p>
        </section>

        <section>
          <h2 className="font-bold">4. 投稿写真・コメントの取り扱い</h2>
          <p className="mt-1">
            利用者が投稿した写真は、位置情報（EXIF）を除去したうえで保存します。他の利用者への迷惑行為や規約違反が疑われる投稿は、通報に基づき非表示・削除することがあります。
          </p>
        </section>

        <section>
          <h2 className="font-bold">5. データの保管・削除</h2>
          <p className="mt-1">
            アカウント削除・データ削除をご希望の場合は、下記のお問い合わせ先までご連絡ください。確認のうえ対応いたします。
          </p>
        </section>

        <section>
          <h2 className="font-bold">6. お問い合わせ</h2>
          <p className="mt-1">
            本ポリシーに関するお問い合わせは
            <Link href="/about" className="text-orange-500 underline underline-offset-2">
              このアプリについて
            </Link>
            のページよりご連絡ください。
          </p>
        </section>
      </div>
    </div>
  );
}
