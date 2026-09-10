import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";

import akabane from "@/data/spots-akabane.json";
import akihabara from "@/data/spots-akihabara.json";
import asakusa from "@/data/spots-asakusa.json";
import ebisu from "@/data/spots-ebisu.json";
import gotanda from "@/data/spots-gotanda.json";
import ikebukuro from "@/data/spots-ikebukuro.json";
import kamata from "@/data/spots-kamata.json";
import kanda from "@/data/spots-kanda.json";
import kawasaki from "@/data/spots-kawasaki.json";
import kichijoji from "@/data/spots-kichijoji.json";
import kinshicho from "@/data/spots-kinshicho.json";
import kitasenju from "@/data/spots-kitasenju.json";
import koenji from "@/data/spots-koenji.json";
import mishima from "@/data/spots-mishima.json";
import nakano from "@/data/spots-nakano.json";
import omiya from "@/data/spots-omiya.json";
import shibuya from "@/data/spots-shibuya.json";
import shimbashi from "@/data/spots-shimbashi.json";
import shinagawa from "@/data/spots-shinagawa.json";
import shinjuku from "@/data/spots-shinjuku.json";
import suidobashi from "@/data/spots-suidobashi.json";
import tachikawa from "@/data/spots-tachikawa.json";
import takadanobaba from "@/data/spots-takadanobaba.json";
import tokyo from "@/data/spots-tokyo.json";
import ueno from "@/data/spots-ueno.json";
import yokohama from "@/data/spots-yokohama.json";

// Gemini収集分(data/spots-*.json)をDBへ一括投入する管理用エンドポイント。
// scripts/import-spots.ts と同じロジックだが、ローカルNode環境からDB/Google APIに
// 直接繋ぐ手段がない(このプロジェクトのDB更新は常にVercel経由)ため、
// デプロイ後に一度だけ叩く形にしている。
//
// 認証は CRON_SECRET を流用(?secret=クエリ か Authorization: Bearer のどちらでも可。
// ブラウザから手動で叩けるようクエリパラメータも許可する)。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";
// 194件を逐次ジオコーディングするとVercelのデフォルトタイムアウトを超えかねないため延長。
// それでも1回で捌ききれない場合に備え、offset/limitクエリでバッチ実行できるようにする。
export const maxDuration = 60;

type SpotCandidate = {
  name: string;
  address: string;
  nearestStation: string;
  category?: Category;
  tagline?: string;
  subCategories?: string[];
  hasCounterSeat?: boolean;
  senberoAvailable?: boolean;
  soloFriendliness?: number;
  sourceNote?: string;
};

const ALL_CANDIDATES: SpotCandidate[] = [
  ...akabane,
  ...akihabara,
  ...asakusa,
  ...ebisu,
  ...gotanda,
  ...ikebukuro,
  ...kamata,
  ...kanda,
  ...kawasaki,
  ...kichijoji,
  ...kinshicho,
  ...kitasenju,
  ...koenji,
  ...mishima,
  ...nakano,
  ...omiya,
  ...shibuya,
  ...shimbashi,
  ...shinagawa,
  ...shinjuku,
  ...suidobashi,
  ...tachikawa,
  ...takadanobaba,
  ...tokyo,
  ...ueno,
  ...yokohama,
] as SpotCandidate[];

type GeocodeResult = { ok: true; lat: number; lng: number } | { ok: false; status: string; message?: string };

async function geocode(address: string, apiKey: string): Promise<GeocodeResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  if (loc) return { ok: true, lat: loc.lat, lng: loc.lng };
  // status(REQUEST_DENIED等)とerror_messageをそのまま返し、失敗原因をレスポンスから直接わかるようにする
  return { ok: false, status: data?.status ?? `HTTP_${res.status}`, message: data?.error_message };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const authorized = auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_SERVER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_SERVER_API_KEY is not set" }, { status: 500 });

  // 1回で処理しきれない場合のバッチ実行用。例: ?offset=0&limit=50 → 次は ?offset=50&limit=50
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? String(ALL_CANDIDATES.length));
  const batch = ALL_CANDIDATES.slice(offset, offset + limit);

  const results: {
    name: string;
    action: "created" | "updated" | "geocode_failed";
    geocodeStatus?: string;
    geocodeMessage?: string;
  }[] = [];

  for (const candidate of batch) {
    const geo = await geocode(candidate.address, apiKey);
    if (!geo.ok) {
      results.push({ name: candidate.name, action: "geocode_failed", geocodeStatus: geo.status, geocodeMessage: geo.message });
      continue;
    }
    const coords = geo;

    const existing = await prisma.spot.findFirst({
      where: { name: candidate.name, address: candidate.address },
    });

    const data = {
      name: candidate.name,
      category: candidate.category ?? Category.SOLO_NOMI,
      address: candidate.address,
      tagline: candidate.tagline,
      subCategories: candidate.subCategories ?? [],
      hasCounterSeat: candidate.hasCounterSeat ?? true,
      senberoAvailable: candidate.senberoAvailable ?? false,
      soloFriendliness: candidate.soloFriendliness ?? 5,
      latitude: coords.lat,
      longitude: coords.lng,
      nearestStation: candidate.nearestStation,
      sourceNote: candidate.sourceNote,
    };

    if (existing) {
      await prisma.spot.update({ where: { id: existing.id }, data });
      results.push({ name: candidate.name, action: "updated" });
    } else {
      await prisma.spot.create({ data });
      results.push({ name: candidate.name, action: "created" });
    }
  }

  const summary = {
    processedRange: `${offset}-${offset + batch.length}`,
    totalCandidates: ALL_CANDIDATES.length,
    remaining: Math.max(0, ALL_CANDIDATES.length - (offset + batch.length)),
    created: results.filter((r) => r.action === "created").length,
    updated: results.filter((r) => r.action === "updated").length,
    geocodeFailed: results.filter((r) => r.action === "geocode_failed").length,
  };

  return NextResponse.json({ summary, results });
}
