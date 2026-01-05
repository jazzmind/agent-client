import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors in story files during build
    ignoreBuildErrors: false,
  },
  cacheComponents: true,
  experimental: {
    // Ensure proper handling of ESM modules
    esmExternals: true,
  },
  // Exclude story files from being processed by Next.js
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => !ext.includes('stories')),
  // Use basePath when deployed to Busibox at /agents
  // For subdomain deployment (agents.domain.com), NEXT_PUBLIC_BASE_PATH should not be set
  // For local dev with nginx proxy, set NEXT_PUBLIC_BASE_PATH=/agents
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Asset prefix for proper asset loading
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Ensure trailing slash handling works correctly with basePath
  trailingSlash: false,
};

export default nextConfig;
