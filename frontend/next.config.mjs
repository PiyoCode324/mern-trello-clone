/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: { appDir: true }, // App Router を使用している場合
  eslint: {
    ignoreDuringBuilds: true, // ビルド時に ESLint エラーで止まらないようにする
  },
};

export default nextConfig;
