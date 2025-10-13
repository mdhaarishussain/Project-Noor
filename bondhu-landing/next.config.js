/**
 * Next.js configuration with redirects for legacy slugs.
 * Adds a permanent redirect from /terms-and-conditions to /terms-of-service
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/terms-and-conditions',
        destination: '/terms-of-service',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
