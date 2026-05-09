import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  transpilePackages: ['@nice-tools/isoframe', '@nice-tools/isocsv', '@nice-tools/isoframe-react', '@nice-tools/isojson'],
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
