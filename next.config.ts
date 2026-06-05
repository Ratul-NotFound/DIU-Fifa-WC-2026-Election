import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'ibb.co' },
      { protocol: 'https', hostname: 'imgbb.com' },
      { protocol: 'https', hostname: '**.imgbb.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google profile photos
      { protocol: 'https', hostname: '**.githubusercontent.com' },
    ],
  },
  // Disable dev indicators (floating N logo overlay)
  devIndicators: false,
  // Reduce bundle size
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
