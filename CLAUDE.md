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

### オンデマンドAI検索パイプライン(status: AI_SUGGESTED)

データが薄い駅をその場で埋めるための仕組み。人力での事前収集を待たず、
Geminiに検索させて即DBに入れるが、**人力確認前は`status: AI_SUGGESTED`のまま
「AI提案・未確認」バッジ付きで検索結果に出す**設計(承認待ちにして隠すのではなく、
出しつつ透明性を確保する方針)。

- `GET /api/admin/ai-search-spots?station=<駅名>&secret=<CRON_SECRET>`
  Gemini(`gemini-3.7-flash`、Google検索グラウンディング`tools:[{google_search:{}}]`
  + `responseSchema`で構造化出力。Gemini 3系はgrounding+responseSchemaの併用が可能)
  にその場で駅周辺の店を調べさせ、ジオコーディングしてstatus: AI_SUGGESTEDで作成。
  重複(同名+同住所)は既存データを壊さないようスキップする
- `GET /api/admin/spots/pending?secret=...`(任意で`&station=`で絞り込み)
  レビュー待ち一覧。各行にapprove/rejectのURLを含めて返すので、それを開くだけで良い
- `GET /api/admin/spots/[id]/approve?secret=...` → status: ACTIVEに確定
- `GET /api/admin/spots/[id]/reject?secret=...` → 削除(AI_SUGGESTED以外は誤操作防止で拒否)

**注意点:**
- `/api/spots`はACTIVEとAI_SUGGESTEDの両方を返す(NEEDS_REVIEW・CLOSEDは除外)。
  クライアント側は`status`フィールドを見て`AiSuggestedBadge`(`components/SpotCard.tsx`)
  を出し分けている
- ハルシネーション対策(実在確認・チェーン除外・店名誤変換の防止)は
  `docs/gemini-data-collection-handoff.md`のルールをプロンプトに要約して埋め込んでいる
  が、人力レビューほど厳密ではない。**必ず`/api/admin/spots/pending`で定期的に
  レビューし、承認/削除を進めること**(バッジ付きで出しっぱなしにしない)

### 既知の落とし穴
- 複数駅のデータで同じ店名パターンが駅名だけ差し替えて再利用される
  (ハルシネーションの一種)。3駅以上での出現パターンを機械的に検出し、
  「同一都道府県に5店舗以上」を閾値にチェーンとみなして除外するルールを
  引き継ぎ書に明記済み。**2026-09、Phase 1収集時に、このルールに引っかかる
  はずの店(魚金・魚菜割烹魚市・日本酒スタンド蔵元屋・イタリアンバール
  イル・ソーレ・昭和大衆酒場・手打蕎麦満留賀等)がPhase 0の194件に
  除外されずそのまま混入していたことが判明**。`/api/admin/cleanup-known-hallucinations`
  (`?dry=1`でプレビュー、外すと削除実行)で一括削除できるようにした。
  削除後は影響駅ごとに`/api/admin/ai-search-spots?station=<駅名>`で
  AI提案(要レビュー)を集め直す運用
- 住所にビル名を含めるとGeocoding APIが`ZERO_RESULTS`を返すことがある
  (番地までに簡略化すると通ることが多い)
- 店名は住所やURLが正しくても誤変換されることがある(実例: 「ベルク」→
  「ベルゴロド(BERG)」)。ユーザーの現地知識での二重チェックが最終防波堤
- **`sourceNote`のURL自体が捏造されていることがある**。実際の`1000bero.net`は
  `restaurant-646`のような数字IDのみのURL構造だが、Phase 1の一部データは
  `restaurant-kanda-uosho`のような(実在しない)slug形式で出典URLを生成していた。
  出典URLが存在すること自体を鵜呑みにせず、店名で個別にWebSearchして実在確認
  すること(このサンドボックスは`tabelog.com`等へのWebFetchはブロックされているが、
  WebSearchは使えるので、店名+住所のキーワードで独立した情報源に当たれるか確認する)。
  神田駅・赤羽駅はこの方法で個別検証済み(神田13→8件、赤羽11→6件に絞り込み、
  住所の誤りも複数修正)。**既存のPhase 0の194件はこの個別検証をしていないため、
  同種の誤り(閉店店舗・住所ズレ・出典URL捏造)が残っている可能性がある**
- **店名・住所は正しいのに、tabelogのURL(数字ID部分)だけが無関係の別店舗を
  指すケースがある**(有楽町駅の提出15件全てで発生。URL全体の作文より巧妙で
  見抜きにくい)。この失敗率が100%だったため、**tabelog形式のURLは要求しない
  運用に変更済み**(`sourceNote`は任意項目、確証がなければ空文字でよい)
- **東京23区外(地方都市)はハルシネーション率が跳ね上がる**。三島市(静岡県)
  で14件提出させたところ、実在確認できたのは1件のみ(13件が存在しない・
  住所不一致・大手チェーンで除外のいずれか)。Geminiの学習データが薄いと
  思われるエリアでは、東京都内よりさらに厳しく個別検証すること
- **Phase 0の既存データも個別検証すると全滅することがある**。錦糸町駅の
  既存13件を個別検証した結果、**13件全てが捏造または実在確認不可**だった
  (うち8件はCLAUDE.mdに既出のハルシネーションテンプレートと完全一致。
  残り5件のうち2件は、新規データで判明した実在店の正しい住所を盗用した
  典型的な捏造だった)。13件を全て削除し、ChatGPT提供の新規データで
  個別検証済みの13件に丸ごと置き換えた。**他の未検証駅(Phase 0の194件の
  大部分)でも同様の汚染がある前提で扱うこと**

## 進行中・未着手
- Phase 0の対象15駅のうち高円寺駅だけ未収集だったが、Phase 1で1件(きど藤)を
  個別検証の上で投入し解消
- Phase 1(東京・神田・有楽町・赤羽・品川・中野・吉祥寺・高田馬場・大宮・蒲田の
  10駅、各15軒目安)は進行中。人力Gemini手順は
  `docs/gemini-data-collection-handoff-phase1.md`参照。追加で浅草駅も対応済み。
  投入済み件数(2026-09時点): 神田8・赤羽16・東京4・品川10・浅草2・大宮1・高円寺1・
  中野14・吉祥寺11・高田馬場15・蒲田12(有楽町は4回提出とも実在確認できず未投入)。
  錦糸町はPhase 0の13件が個別検証で全滅したため、検証済み13件に総入れ替え済み。
  吉祥寺・高田馬場・蒲田・追加分の赤羽/品川はChatGPT提供データを個別検証して投入
  (GeminiよりChatGPT提供分の方が実在確認率が高い傾向。ChatGPT分も住所ズレは
  多いが、店自体は実在するケースが大半だった)
- 東京圏10駅とは別に、三島市(静岡県)・大阪市梅田駅を新規エリアとして追加。
  三島1件(うなぎ桜家、`data/spots-mishima.json`)、梅田5件(`data/spots-umeda.json`、
  串かつ松葉・銀座屋等。七津屋9店舗・徳田酒店7+店舗・たよし5店舗は大手チェーン
  として除外)投入済み。地方都市はハルシネーション率・チェーン比率が高いため、
  追加収集は慎重に進める必要がある
- 未着手駅の追加候補(利用客数・呑み屋密度で選定): 大井町・目黒・中目黒・
  三軒茶屋・下北沢・自由が丘・巣鴨・亀戸・西荻窪・町田
- Places API (New) を使った月次閉店確認バッチ(`app/api/cron/check-closures`、
  `vercel.json`でCron設定済み)は未検証(Places APIキーの動作確認がまだ)
- 実店舗データ収集のオンデマンドAI検索(`/api/admin/ai-search-spots`)は実装済みだが
  未検証(このリポジトリのサンドボックスからGemini/Geocoding APIに接続できないため、
  実際の検索結果の質は本番でユーザーが確認する必要がある)
