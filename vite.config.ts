import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/bindery/',
  plugins: [react()],
  build: {
    // Fonts are self-hosted; keep them as files rather than inlining megabytes of base64.
    assetsInlineLimit: 0,
  },
});
