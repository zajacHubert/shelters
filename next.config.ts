import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use a dedicated tsconfig that covers only the app src.
  // The root tsconfig.json also includes scripts/ and tests/ which are
  // Bun/CLI tooling files with Bun-only deps not resolvable by Next.js.
  typescript: {
    tsconfigPath: './tsconfig.app.json',
  },
};

export default nextConfig;

// Enables Cloudflare bindings (KV, D1, R2, etc.) during `next dev`.
// This import is a no-op in production builds; safe to leave unconditionally.
// see https://opennext.js.org/cloudflare/get-started#12-develop-locally
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
