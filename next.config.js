/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Remove assetPrefix that's causing issues
  // Remove distDir override - let Next.js use default 'out'
  // Remove experimental optimizeCss that breaks styling
}

module.exports = nextConfig
