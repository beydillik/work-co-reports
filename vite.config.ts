/// <reference types="vitest/config" />
// Build configuration.
// Produces ONE self-contained file (dist/co-reports.html) with all JS/CSS inlined,
// so it can be copied to IIS as a static file or opened from a network drive (D-011, D-012).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { renameSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteSingleFile(),
    {
      // Vite always names the entry index.html; rename it to the agreed file name.
      name: 'rename-output',
      closeBundle() {
        renameSync(resolve('dist/index.html'), resolve('dist/co-reports.html'));
      },
    },
  ],
  build: { outDir: 'dist', emptyOutDir: true },
  test: { include: ['tests/**/*.test.ts'] },
});
