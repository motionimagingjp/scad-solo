# 来店ログ写真機能 実装指示書

## 背景・現状

`VisitLog.imageUrl`(Prismaスキーマ)は存在し、`POST /api/logs`もこのフィールドを受け取って保存する処理は書かれている。しかし**呼び出し側のUIが一切ない**。チェックイン画面(`app/checkin/[spotId]/page.tsx`)は`{ spotId }`のみ送信、来店ログ一覧(`app/logs/page.tsx`)も`imageUrl`を表示・送信していない。つまり「DBの受け皿だけがあり、撮る/見るUIがゼロ」の状態。本書はこれを実装するための指示書。

似た機能として `app/games/drink-roulette/page.tsx` に「メニューを撮影→AIが読み取る」機能が既にあるが、あちらは画像を**保存しない**(Geminiに投げて結果だけ使い捨て)。今回は**画像そのものを保存して後から見返せるようにする**点が異なり、恒久ストレージが新たに必要になる。

## 目的

来店を記録するタイミング(チェックイン完了画面)で任意で写真を添付でき、後から「ソロ活」タブの来店ログ一覧で見返せるようにする。

## 設計方針

- **ストレージ: Vercel Blob を採用**。このプロジェクトはVercelホスティングで、既存の画像配信(グランスタ等の店舗写真は使っていないが)と親和性が高く、追加のインフラ契約が不要。`@vercel/blob`パッケージを追加し、Vercelダッシュボードで対象プロジェクトにBlob Storeを1つ作成すると`BLOB_READ_WRITE_TOKEN`が自動で環境変数に入る。
- **任意機能として設計する**。来店記録(`POST /api/logs`)自体は現状どおり即時実行・写真なしで完結させる(既存のFLOW.mdのコメントにある「記録は決定した瞬間に行う」という設計を壊さない)。写真は記録成立後に追加する別アクションとし、失敗してもチェックイン自体は失敗させない。
- **1来店ログにつき写真1枚**。複数枚・アルバム機能は今回のスコープ外(将来必要になったら`VisitLogPhoto`のような別テーブルに切り出す)。
- **EXIFのGPS位置情報は必ず除去してからアップロードする**。個人の来店先(=実際にいた場所)の写真なので、スマホで直接撮った画像には位置情報が埋め込まれていることがある。このアプリの`dataNote`(「現在地は近くの店を探すためだけに使われ、位置情報そのものが保存されることはありません」)の方針と矛盾しないよう、アップロード前にEXIFを剥がす。

## 変更箇所

### 1. 依存追加

```
npm install @vercel/blob
```

Vercelダッシュボード側: 対象プロジェクト → Storage → Create Database → Blob を作成し、本番・デモ両方の環境に接続する(`BLOB_READ_WRITE_TOKEN`が自動付与される)。

### 2. 新規API: `POST /api/logs/[logId]/photo`

`app/api/logs/[logId]/route.ts`の`findOwnLog`ヘルパーを再利用し、本人のログであることを確認してから処理する。

```ts
// app/api/logs/[logId]/photo/route.ts
import { put, del } from "@vercel/blob";
// ... findOwnLog は [logId]/route.ts から import するか共通化する

export async function POST(req: NextRequest, { params }: { params: { logId: string } }) {
  const found = await findOwnLog(req, params.logId);
  if (found.error) return found.error;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid file type" }, { status: 400 });
  }
  const MAX_BYTES = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }

  // EXIF(GPS含む)除去 + リサイズ。sharpで再エンコードすれば自動的にEXIFは落ちる
  const stripped = await stripExifAndResize(file); // 要実装。下記参照

  // 既存写真があれば差し替え前に削除(ストレージを溜めない)
  if (found.log.imageUrl) {
    await del(found.log.imageUrl).catch(() => {}); // 失敗しても差し替えは続行
  }

  const blob = await put(`visit-logs/${params.logId}-${Date.now()}.jpg`, stripped, {
    access: "public",
    contentType: "image/jpeg",
  });

  const updated = await prisma.visitLog.update({
    where: { id: params.logId },
    data: { imageUrl: blob.url },
  });

  return NextResponse.json({ id: updated.id, imageUrl: updated.imageUrl });
}

export async function DELETE(req: NextRequest, { params }: { params: { logId: string } }) {
  const found = await findOwnLog(req, params.logId);
  if (found.error) return found.error;

  if (found.log.imageUrl) {
    await del(found.log.imageUrl).catch(() => {});
  }
  const updated = await prisma.visitLog.update({ where: { id: params.logId }, data: { imageUrl: null } });
  return NextResponse.json({ id: updated.id, imageUrl: updated.imageUrl });
}
```

`stripExifAndResize`は`sharp`(要`npm install sharp`)で実装する。再エンコード(`.jpeg({ quality: 80 })`)するだけでEXIFは自動的に落ちる。ついでに長辺1600px程度にリサイズしてストレージ容量と表示速度を抑える。

既存の`app/api/logs/[logId]/route.ts`の`DELETE`(ログ自体の削除)にも、`imageUrl`があれば`del()`で一緒に消す処理を追加すること(現状は画像だけ孤児化する)。

### 3. UI変更①: チェックイン完了画面(`app/checkin/[spotId]/page.tsx`)

結果表示セクション(「今夜はここに決めました」のカード付近)に、任意の写真追加ボタンを置く。`drink-roulette/page.tsx`と同じ「隠しinput + ボタンで発火」パターンを流用する。

```tsx
const [photo, setPhoto] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file || !result) return;
  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`/api/logs/${result.log.id}/photo`, {
      method: "POST",
      headers: USER_HEADERS, // Content-Typeはbrowserがmultipartで自動設定するので付けない
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setPhoto(data.imageUrl);
    }
  } finally {
    setUploading(false);
  }
};
```

`CheckinResult`型に`log: { id: string }`を追加する必要がある(現在のレスポンスの`log`には`id`が入っているので、型定義に足すだけでよい)。

ボタンの文言は「写真を残す(任意)」程度にし、スキップしても次の導線(Threadsシェア等)の邪魔にならない位置に置く。

### 4. UI変更②: 来店ログ一覧(`app/logs/page.tsx`)

`VisitLog`型に`imageUrl: string | null`を追加し、`/api/me`のレスポンスにも含める(`app/api/me/route.ts`側で`select`していれば自動で乗るはずだが、明示的に確認すること)。

各ログの行に:
- `imageUrl`があればサムネイル表示(タップで拡大 or 別タブで原寸表示)
- 鉛筆アイコン(既存のメモ編集)の並びに、カメラアイコンで「写真を追加/変更」ボタン
- 既存メモの編集フロー(`startEditing`/`saveMemo`)と同様に、アップロード中はローディング表示、成功したら`loadMe()`で再取得

### 5. バリデーション・エラー時の挙動

- 画像以外のファイル、8MB超は400エラーでUI側にエラートースト表示(アラートで十分)
- Blobアップロード失敗時もチェックイン自体(来店記録)は既に成立しているので、失敗を伝えつつ「来店記録は保存済み」であることが分かるメッセージにする
- オフライン等でfetch自体が失敗した場合はdrink-rouletteと同様catchして静かに失敗表示

## スコープ外(今回やらないこと)

- 複数枚添付
- 他ユーザーへの公開・SNSへの自動投稿(あくまで自分用の記録)
- 画像のAI分析・自動タグ付け
- 既存の194件超の店舗データへの店舗写真(これは`Spot`側の別概念であり、`VisitLog`の個人写真とは無関係)

## 想定工数感

- API(アップロード・削除・既存DELETE修正): 半日
- チェックイン画面UI: 半日
- 来店ログ一覧UI(サムネイル表示・差し替え): 半日
- 動作確認(実機カメラ・ギャラリー選択、Playwrightでのfile input操作確認): 半日

合計 おおよそ2人日。
