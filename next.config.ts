import type { NextConfig } from "next";

// =============================================================================
// Agent Manager Next.js Configuration
// =============================================================================
//
// busibox-app resolution:
//   - Dev mode: npm link creates symlink, turbopack follows it automatically
//   - Prod mode: installed from npm registry
//
// No webpack aliases needed - npm link handles module resolution.
// =============================================================================

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  
  experimental: {
    esmExternals: true,
  },
  
  // Exclude storybook files from page routing
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => !ext.includes('stories')),
  
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: false,

  // Enable standalone output for production Docker builds
  output: 'standalone',
};

export default nextConfig;
