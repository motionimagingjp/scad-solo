# SCAD-SOLO

一人飲みの店を探すアプリ。トップ画面「今夜の3軒」は現在地から近い順にDBの店舗を
検索して3軒ずつ表示する(ランダム抽選ではない、検索画面)。画面遷移・設計判断の
詳細は `FLOW.md` を参照。

## スタック
- Next.js 14 App Router / TypeScript / Tailwind CSS
- Prisma + PostgreSQL(Vercel経由のNeon、シンガポールリージョン)
- Google Maps JavaScript API / Geocoding API(サーバー用は別キー、下記参照)
- デプロイ: Vercel(`motionimagingjp/scad-solo`, `main`ブランチ)

## 開発環境の制約(重要)
このリポジトリで作業するClaude Codeセッションは、多くの場合サンドボックス化
されておりDB(Neon)にもGoogle系APIにも直接ネットワーク接続できない
(名前解決・TCP接続がプロキシで塞がれている)。そのため:
- **DBの変更は常にVercel経由**(ビルド時の`prisma migrate deploy && prisma db seed`、
  または本番にデプロイされたAPIルートをユーザーのブラウザから叩く形)で行う。
  ローカルNode環境からスクリプトを直接実行してDBに書き込む、という前提を置かない。
- 実装の妥当性確認は`npx tsc --noEmit`・`next build`・Playwrightでのモックテスト
  (`page.route()`でAPIをモック)まで。実際のDB挙動やGoogle Maps表示は、
  ユーザー自身の本番ブラウザでの確認に頼る。

## APIキーの使い分け(要注意)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: ブラウザ用、HTTPリファラー制限あり
  (`https://*.vercel.app/*`)。**サーバーサイドのfetchには使えない**
  (`API keys with referer restrictions cannot be used with this API`で弾かれる)
- `GOOGLE_SERVER_API_KEY`: サーバー用(Geocoding API・Places API)、
  アプリケーション制限「なし」、API制限はGeocoding/Placesのみに絞った専用キー
- `CRON_SECRET`: 管理用APIルート(`/api/cron/check-closures`、
  `/api/admin/import-spots`)の認証に共用
- `GEMINI_API_KEY`: ドリンクルーレット(`/api/roulette/extract`)がメニュー画像から
  飲み物候補を抽出するのに使うGemini APIキー(Google AI Studioで発行、Maps/Geocoding
  とは別物)。**未設定でもゲームは動く**(`lib/data/drinkRouletteFallback.ts`の定番
  リストに自動フォールバックする設計)。使うモデルは`gemini-3.7-flash`
  (`generativelanguage.googleapis.com`、`x-goog-api-key`ヘッダで認証)

## 主要な設計判断
- ホーム画面はシャッフル性を持たない検索画面(「今夜の3軒」)。エンタメ性は
  `/games`タブ(未実装のミニゲーム一覧)側で担う方針
- 来店ログはスタンプ機能を廃止し、メモ編集+削除に一本化
- DB(シンガポール)を読み書きするAPI/ページは`preferredRegion = "sin1"`を指定
- Neon無料枠のコールドスタート(初回~2秒)はコストとして許容する判断済み

## 実店舗データ投入パイプライン
`docs/gemini-data-collection-handoff.md`にGemini向けの収集ルール(対象駅、
JSON形式、チェーン除外基準、ハルシネーション対策)をまとめてある。収集した
候補は`data/spots-<station>.json`に保存し、`scripts/validate_spots.js`相当の
検証(このリポジトリには未コミット、都度スクラッチパッドで実行)でスキーマ・
チェーン店・住所異常をチェックしてからDBへ投入する。

投入は`app/api/admin/import-spots/route.ts`(GET、`?secret=`or
`Authorization: Bearer`で認証、`offset`/`limit`でバッチ実行)を
デプロイ後にユーザーが叩く形。194件を50件ずつ4バッチで投入した実績あり。

### 既知の落とし穴
- 複数駅のデータで同じ店名パターンが駅名だけ差し替えて再利用される
  (ハルシネーションの一種)。3駅以上での出現パターンを機械的に検出し、
  「同一都道府県に5店舗以上」を閾値にチェーンとみなして除外するルールを
  引き継ぎ書に明記済み
- 住所にビル名を含めるとGeocoding APIが`ZERO_RESULTS`を返すことがある
  (番地までに簡略化すると通ることが多い)
- 店名は住所やURLが正しくても誤変換されることがある(実例: 「ベルク」→
  「ベルゴロド(BERG)」)。ユーザーの現地知識での二重チェックが最終防波堤

## 進行中・未着手
- 高円寺駅の実店舗データが未収集(対象15駅のうち14駅・194件のみ投入済み)
- Places API (New) を使った月次閉店確認バッチ(`app/api/cron/check-closures`、
  `vercel.json`でCron設定済み)は未検証(Places APIキーの動作確認がまだ)
- 実店舗データ収集でのGemini API(候補発掘の自動化)は未着手。現状は人間がGeminiに
  手動で依頼し、JSONを貼り付けてもらう運用(ドリンクルーレットのGemini連携とは別件)
