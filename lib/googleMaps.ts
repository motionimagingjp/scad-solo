// Google Maps JavaScript APIをクライアント側で1回だけ読み込むためのローダー。
// 型定義パッケージ(@types/google.maps)は入れず、この1ファイル内だけ any で扱う。

declare global {
  interface Window {
    google?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("window is undefined"));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = "__scadSoloGoogleMapsCallback";
    (window as any)[callbackName] = () => resolve(window.google);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps の読み込みに失敗しました"));
    document.head.appendChild(script);
  });
  return loadPromise;
}
