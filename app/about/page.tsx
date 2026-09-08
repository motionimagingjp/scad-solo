import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { APP_ABOUT } from "@/lib/data/about";
import { SCAD_APPS } from "@/lib/data/scadApps";

// 「このアプリについて」画面。SCAD-BEAUTYの共通フォーマット(APP_ABOUT)に合わせた構成。
export default function AboutPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50 pb-10">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/mypage" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">このアプリについて</h1>
      </header>

      <div className="space-y-5 px-4 py-5">
        <div className="flex items-center gap-3.5">
          <img
            src={APP_ABOUT.avatarImage}
            alt={APP_ABOUT.name}
            className="h-15 w-15 rounded-full object-cover"
            style={{ width: 60, height: 60 }}
          />
          <div>
            <p className="text-sm font-bold">{APP_ABOUT.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{APP_ABOUT.tagline}</p>
          </div>
        </div>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">私について</p>
          <div className="mt-2 rounded-r-xl border-l-[3px] border-orange-400 bg-white py-2.5 px-3.5 text-xs leading-relaxed">
            {APP_ABOUT.story}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">このアプリについて</p>
          <div className="mt-2 rounded-r-xl border-l-[3px] border-orange-400 bg-white py-2.5 px-3.5 text-xs leading-relaxed">
            {APP_ABOUT.appIntro}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {APP_ABOUT.appFeatures.map((f) => (
              <div key={f.label} className="flex items-start gap-2.5">
                <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm" style={{ width: 26, height: 26 }}>
                  {f.emoji}
                </span>
                <div>
                  <p className="text-xs font-bold">{f.label}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">個人情報の取り扱いについて</p>
          <div className="mt-2 rounded-r-xl border-l-[3px] border-orange-400 bg-white py-2.5 px-3.5 text-xs leading-relaxed">
            {APP_ABOUT.dataNote}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">SCADシリーズ</p>
          <div className="mt-2 flex flex-col">
            {SCAD_APPS.map((app) => {
              const isCurrent = app.isCurrent;
              const row = (
                <>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-500">
                    {app.name.replace("SCAD-", "").slice(0, 1)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-1.5">
                    <span className="text-sm font-bold">{app.name}</span>
                    <span className="text-[11px] text-gray-400">{app.tagline}</span>
                  </span>
                  {!isCurrent && <span className="shrink-0 text-gray-300">›</span>}
                </>
              );
              return isCurrent ? (
                <div key={app.id} className="flex items-center gap-2.5 border-b py-2.5 last:border-b-0">
                  {row}
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                    利用中
                  </span>
                </div>
              ) : (
                <a
                  key={app.id}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 border-b py-2.5 last:border-b-0"
                >
                  {row}
                </a>
              );
            })}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">お問い合わせ・SNS</p>
          <div className="mt-2 flex gap-2.5">
            {APP_ABOUT.sns.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9.5 w-9.5 items-center justify-center rounded-full border bg-white text-xs font-bold text-gray-600"
                style={{ width: 38, height: 38 }}
              >
                {s.label.slice(0, 1)}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
