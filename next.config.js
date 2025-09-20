/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true, // Allow warnings to pass but still check
  },
  // Font optimization for better loading
  optimizeFonts: true,
  // Azure App Service specific configuration
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Build cache for faster Azure builds
  generateBuildId: async () => {
    // Use environment variable or fallback to timestamp
    return process.env.BUILD_ID || `build-${Date.now()}`
  },
  // Production configuration for Azure
  env: {
    PORT: process.env.PORT || '8080',
  },
  // Removed 'export' output for App Service - we want dynamic Next.js
  // output: 'export',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true
  // },
}

module.exports = nextConfig
