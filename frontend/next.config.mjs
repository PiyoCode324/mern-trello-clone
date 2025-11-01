/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: { appDir: true }, // App Router を使用している場合
};

export default nextConfig;
