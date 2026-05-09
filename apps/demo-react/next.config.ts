import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nice-tools/isoframe', '@nice-tools/isocsv', '@nice-tools/isoframe-react', '@nice-tools/isojson'],
};

export default nextConfig;
