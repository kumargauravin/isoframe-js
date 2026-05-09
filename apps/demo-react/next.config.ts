import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nice-tools/isoframe', '@nice-tools/isocsv', '@nice-tools/isoframe-react'],
};

export default nextConfig;
