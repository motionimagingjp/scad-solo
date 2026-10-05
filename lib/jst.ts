// サーバーはUTCで動くため、「1日1回」などの日付判定は必ずJST(Asia/Tokyo)の日付に変換して行う
const JST_DATE = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" });

/** JSTの日付を "YYYY-MM-DD" で返す */
export function jstDateString(date: Date = new Date()): string {
  return JST_DATE.format(date);
}
