import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// defineCloudflareConfig() doesn't accept buildCommand as a parameter —
// spread it and add buildCommand at the top level of the OpenNextConfig.
// Without this, OpenNext detects bun.lock in the repo and tries
// `bun run build`, which fails on Linux CI runners where bun is not installed.
export default {
  ...defineCloudflareConfig(),
  buildCommand: 'npm run build',
};
