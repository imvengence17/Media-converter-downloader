/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'sharp',
      'fluent-ffmpeg',
      'ffmpeg-static',
      'tesseract.js',
      'pdf-parse',
      'youtubei.js',
    ],
    outputFileTracingIncludes: {
      '/api/convert/**': ['./node_modules/ffmpeg-static/**'],
    },
    optimizePackageImports: ['@designcodeio/threeui', 'lucide-react'],
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
