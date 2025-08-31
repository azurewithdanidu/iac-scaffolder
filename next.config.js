/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Font optimization for better loading
  optimizeFonts: true,
  // Build cache for faster Azure builds
  generateBuildId: async () => {
    // Use environment variable or fallback to timestamp
    return process.env.BUILD_ID || `build-${Date.now()}`
  },
  // Removed 'export' output for App Service - we want dynamic Next.js
  // output: 'export',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true
  // },
}

module.exports = nextConfig
