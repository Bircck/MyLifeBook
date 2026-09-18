import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  server: { port: 4321 },
  vite: {
    server: {
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/content/**', '**/imports/**', '**/artifacts/**', '**/private/**', '**/personal/**', '**/local-content/**', '**/exports/**'] },
    },
  },
});
