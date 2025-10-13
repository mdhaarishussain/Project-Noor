import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to succeed even if ESLint reports errors in the repo.
  // This is useful to unblock deployment while lint/type fixes are worked on.
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // Keep TypeScript build checking enabled by default. If you also want to
  // ignore TypeScript errors during CI builds, set `ignoreBuildErrors: true`.
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        port: '',
        pathname: '/dms/image/**',
      },
    ],
  },
};

export default nextConfig;
