import type { NextConfig } from "next";
import * as fs from "fs";
import * as path from "path";

// Check if we're using a local (npm linked) busibox-app
const busiboxPath = path.resolve(__dirname, "node_modules/@jazzmind/busibox-app");
const isLinkedBusibox = fs.lstatSync(busiboxPath, { throwIfNoEntry: false })?.isSymbolicLink() ?? false;

if (isLinkedBusibox) {
  console.log("✓ Using LOCAL busibox-app (npm linked) - TypeScript source will be transpiled");
} else {
  console.log("✓ Using PUBLISHED busibox-app from npm");
}

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
  // Use basePath when deployed to Busibox at /agents
  // For subdomain deployment (agents.domain.com), NEXT_PUBLIC_BASE_PATH should not be set
  // For local dev with nginx proxy, set NEXT_PUBLIC_BASE_PATH=/agents
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Asset prefix for proper asset loading
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Ensure trailing slash handling works correctly with basePath
  trailingSlash: false,

  // Transpile busibox-app when it's npm-linked (local development)
  // This allows Next.js to compile TypeScript source files from the linked package
  transpilePackages: isLinkedBusibox ? ['@jazzmind/busibox-app'] : [],

  // Allow Next.js to resolve files outside the project directory
  // This is required for npm link to work properly
  ...(isLinkedBusibox && {
    outputFileTracingRoot: path.join(__dirname, '../'),
  }),
};

export default nextConfig;
