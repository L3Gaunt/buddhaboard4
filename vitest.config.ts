import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: process.env.SEED ? ['./tests/seeds/setup.ts'] : ['./tests/setup.ts'],
    include: process.env.SEED ? ['./tests/seeds/**/*.test.ts'] : ['./tests/**/*.test.ts'],
    exclude: process.env.SEED ? [] : ['./tests/seeds/**/*'],
    globals: true,
    env: loadEnv('test', process.cwd(), ''),
    testTimeout: 30000, // 30 seconds
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 