/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本のセキュリティヘッダー(位置情報は「近くの店」機能で使うため自サイトのみ許可)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
