// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 빌드 시 에러를 엄격하게 체크하지 않도록 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
