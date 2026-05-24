import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // Force npm as the build runner. Without this, OpenNext detects bun.lock
  // in the repo and tries `bun run build`, which fails on Linux CI runners
  // where bun is not installed.
  buildCommand: 'npm run build',
});
