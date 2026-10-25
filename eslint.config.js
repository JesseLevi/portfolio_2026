import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      '.vercel/',
      'node_modules/',
      'screenshots/',
      'test-results/',
      'playwright-report/',
      '.claude/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // Node-scripts (geen bundler): globals handmatig, zonder extra pakket.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', Buffer: 'readonly', console: 'readonly' },
    },
  },
);
