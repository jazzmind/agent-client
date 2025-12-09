import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors in story files during build
    ignoreBuildErrors: false,
  },
  experimental: {
    // Ensure proper handling of ESM modules
    esmExternals: true,
  },
  // Exclude story files from being processed by Next.js
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => !ext.includes('stories')),
  // Add basePath and assetPrefix for path-based deployment (subdir routing)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/agent-client',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '/agent-client',
};

export default nextConfig;
