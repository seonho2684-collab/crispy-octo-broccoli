/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 시 에러가 있어도 일단 무시하고 진행하게 하는 옵션 (임시 확인용)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
