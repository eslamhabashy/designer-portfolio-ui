/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mir-s3-cdn-cf.behance.net',
      },
      {
        protocol: 'https',
        hostname: 'mir-cdn.behance.net',
      },
      {
        protocol: 'https',
        hostname: 'mir-cdn-cf.behance.net',
      },
      {
        protocol: 'https',
        hostname: 'a5.behance.net',
      },
      {
        protocol: 'https',
        hostname: 'a6.behance.net',
      },
      {
        protocol: 'https',
        hostname: 'eftwsufxiiekqksadode.supabase.co',
      },
    ],
  },
}

export default nextConfig
