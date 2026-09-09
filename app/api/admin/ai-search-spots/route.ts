import { NextRequest, NextResponse } from "next/server";
import { Category, SpotStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// データが薄い駅を埋めるためのオンデマンドAI検索エンドポイント。
// Gemini(Google検索グラウンディング付き)にその場で店を調べさせ、見つかった店を
// status: AI_SUGGESTED としてDBに即投入する。ACTIVEと同じく検索結果に出るが、
// クライアント側で「AI提案・未確認」バッジが付く(=人が見て確定/削除するまでの仮データ)。
//
// 過去の人力収集(docs/gemini-data-collection-handoff.md)で実際にハルシネーション
// (実在しない店・チェーン店の紛れ込み・店名の誤変換)が起きた経緯があるため、
// このエンドポイントは「即座に確定データにする」のではなく「未確認のまま先に出す」
// 設計にしてある。確定/却下は /api/admin/spots/[id]/approve, /reject で行う。
//
// 認証はimport-spotsと同じCRON_SECRET流用(?secret= かAuthorization: Bearer)。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";
// Gemini検索+複数件のジオコーディングで時間がかかるため延長
export const maxDuration = 60;

const MODEL = "gemini-3.7-flash";
const MAX_CANDIDATES = 8;

const ALLOWED_TAGS = new Set(["立ち飲み", "日本酒", "ワイン", "ビール", "女性ひとり歓迎"]);

type GeminiCandidate = {
  name: string;
  address: string;
  tagline?: string;
  subCategories?: string[];
  hasCounterSeat?: boolean;
  senberoAvailable?: boolean;
  soloFriendliness?: number;
  sourceUrl?: string;
};

type GeocodeResult = { ok: true; lat: number; lng: number } | { ok: false; status: string; message?: string };

async function geocode(address: string, apiKey: string): Promise<GeocodeResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  if (loc) return { ok: true, lat: loc.lat, lng: loc.lng };
  return { ok: false, status: data?.status ?? `HTTP_${res.status}`, message: data?.error_message };
}

function buildPrompt(station: string): string {
  return `あなたはSCAD-SOLO(一人飲みの店を探すアプリ)の店舗調査担当です。
「${station}」周辺で、一人でも入りやすい実在の居酒屋・ワインバー・立ち飲み屋をGoogle検索で調べて、
最大${MAX_CANDIDATES}件、以下の条件でJSONで挙げてください。

- 実在し、現在も営業している店だけ(閉業店は不可)
- 出典(公式サイト・食べログ・Googleマップのレビュー等のURL)を実際に確認できた店だけを採用する。
  確証が持てない店は無理に載せず除外する(実在しない店を作ってしまうのが最も避けたい失敗)
- 大手チェーン(日高屋・鳥貴族・磯丸水産・築地銀だこハイボール酒場等)や、
  同一都道府県に5店舗以上ある規模のチェーンは除外する
- 店名は出典ページに実際に書かれている表記をそのまま使う(誤変換・創作をしない)
- 住所は番地まで正確に書く

各店のフィールド:
- name: 店の正式名称
- address: 住所(番地まで)
- tagline: 一言の推し文(20〜30字程度。レビュー等の実際の特徴から。誇張・創作しない)
- subCategories: "立ち飲み"/"日本酒"/"ワイン"/"ビール"/"女性ひとり歓迎" からあてはまるものだけ(無ければ空配列)
- hasCounterSeat: カウンター席があると確認できた場合のみtrue、無い/不明ならfalse
- senberoAvailable: 少額で酔える「せんべろ」と言えるならtrue
- soloFriendliness: 1〜10の主観スコア(一人客への配慮が多いほど高く)
- sourceUrl: 確認した情報源のURL

条件に合う店が見つからない場合は空配列を返してください。`;
}

async function searchWithGemini(station: string, apiKey: string): Promise<GeminiCandidate[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(station) }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            spots: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  address: { type: "STRING" },
                  tagline: { type: "STRING" },
                  subCategories: { type: "ARRAY", items: { type: "STRING" } },
                  hasCounterSeat: { type: "BOOLEAN" },
                  senberoAvailable: { type: "BOOLEAN" },
                  soloFriendliness: { type: "INTEGER" },
                  sourceUrl: { type: "STRING" },
                },
                required: ["name", "address"],
              },
            },
          },
          required: ["spots"],
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error: ${res.status} ${errText}`.slice(0, 500));
  }

  const data = await res.json();
  const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = typeof text === "string" ? JSON.parse(text) : null;
  const spots: unknown = parsed?.spots;
  return Array.isArray(spots) ? spots : [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const authorized = auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const station = searchParams.get("station")?.trim();
  if (!station) return NextResponse.json({ error: "station is required (例: ?station=東京駅)" }, { status: 400 });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
  const geocodeKey = process.env.GOOGLE_SERVER_API_KEY;
  if (!geocodeKey) return NextResponse.json({ error: "GOOGLE_SERVER_API_KEY is not set" }, { status: 500 });

  let candidates: GeminiCandidate[];
  try {
    candidates = await searchWithGemini(station, geminiKey);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gemini検索に失敗しました" }, { status: 502 });
  }

  const results: {
    name: string;
    action: "created" | "skipped_duplicate" | "geocode_failed";
    geocodeStatus?: string;
  }[] = [];

  for (const candidate of candidates) {
    if (!candidate.name?.trim() || !candidate.address?.trim()) continue;

    // 既存データ(人力投入分・過去のAI提案含む)と重複するなら作り直さない
    const existing = await prisma.spot.findFirst({ where: { name: candidate.name, address: candidate.address } });
    if (existing) {
      results.push({ name: candidate.name, action: "skipped_duplicate" });
      continue;
    }

    const geo = await geocode(candidate.address, geocodeKey);
    if (!geo.ok) {
      results.push({ name: candidate.name, action: "geocode_failed", geocodeStatus: geo.status });
      continue;
    }

    const subCategories = (candidate.subCategories ?? []).filter((tag) => ALLOWED_TAGS.has(tag));

    await prisma.spot.create({
      data: {
        name: candidate.name,
        category: Category.SOLO_NOMI,
        address: candidate.address,
        tagline: candidate.tagline,
        subCategories,
        hasCounterSeat: candidate.hasCounterSeat ?? false,
        senberoAvailable: candidate.senberoAvailable ?? false,
        soloFriendliness: candidate.soloFriendliness ?? 5,
        latitude: geo.lat,
        longitude: geo.lng,
        nearestStation: station,
        sourceNote: candidate.sourceUrl ? `AI検索(未確認): ${candidate.sourceUrl}` : "AI検索(未確認)",
        status: SpotStatus.AI_SUGGESTED,
      },
    });
    results.push({ name: candidate.name, action: "created" });
  }

  return NextResponse.json({
    station,
    summary: {
      found: candidates.length,
      created: results.filter((r) => r.action === "created").length,
      skippedDuplicate: results.filter((r) => r.action === "skipped_duplicate").length,
      geocodeFailed: results.filter((r) => r.action === "geocode_failed").length,
    },
    results,
  });
}
