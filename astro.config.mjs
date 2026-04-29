import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://e-sd.ro',
  output: 'server',
  adapter: netlify({
    edgeMiddleware: true,
  }),
});
