/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Removed 'export' output for App Service - we want dynamic Next.js
  // output: 'export',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true
  // },
}

module.exports = nextConfig
