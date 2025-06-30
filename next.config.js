/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google.com *.googleapis.com *.supabase.co; object-src 'none';",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 