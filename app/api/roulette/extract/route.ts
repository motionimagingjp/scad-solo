import { NextRequest, NextResponse } from "next/server";
import { FALLBACK_DRINKS } from "@/lib/data/drinkRouletteFallback";

// ドリンクルーレット「序盤」の工程: 撮影したメニュー画像をGeminiに渡し、
// 飲み物候補を4〜6個抽出させる。GEMINI_API_KEY未設定・API失敗・抽出結果が
// 少なすぎる場合は必ずフォールバックリストを返し、ゲームが詰まないようにする。
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "gemini-3.7-flash";
const MIN_DRINKS = 4;
const MAX_DRINKS = 6;
const FALLBACK_PICK_SIZE = 5;

function pickFallback(): string[] {
  const shuffled = [...FALLBACK_DRINKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, FALLBACK_PICK_SIZE);
}

function fallbackResponse(reason: string) {
  return NextResponse.json({ drinks: pickFallback(), source: "fallback" as const, reason });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "image is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackResponse("GEMINI_API_KEY is not set");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mimeType = file.type || "image/jpeg";

  const prompt =
    "この画像は居酒屋・バーのメニュー表、あるいは壁に貼られたドリンクリストです。" +
    "写っている飲み物の名前だけを4〜6個、実際の表記のまま抽出してJSONで返してください。" +
    "メニューが読み取れない場合や飲み物が写っていない場合は空の配列を返してください。" +
    "架空の飲み物を作らないでください。";

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { drinks: { type: "ARRAY", items: { type: "STRING" } } },
            required: ["drinks"],
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return fallbackResponse(`Gemini API error: ${res.status} ${errText}`.slice(0, 300));
    }

    const data = await res.json();
    const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = typeof text === "string" ? JSON.parse(text) : null;
    const rawDrinks: unknown = parsed?.drinks;

    const drinks = Array.isArray(rawDrinks)
      ? [...new Set(rawDrinks.filter((d): d is string => typeof d === "string" && d.trim().length > 0).map((d) => d.trim()))]
      : [];

    if (drinks.length < MIN_DRINKS) {
      return fallbackResponse("抽出できた飲み物が少なすぎました");
    }

    return NextResponse.json({ drinks: drinks.slice(0, MAX_DRINKS), source: "gemini" as const });
  } catch (err) {
    return fallbackResponse(err instanceof Error ? err.message : "unknown error");
  }
}
