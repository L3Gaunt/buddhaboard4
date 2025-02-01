import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: process.env.SEED ? [
      './tests/seeds/seed.test.ts',
      './tests/seeds/seed_knowledge_base.test.ts'
    ] : ['./tests/**/*.test.ts'],
    exclude: process.env.SEED ? [] : ['./tests/seeds/**/*'],
    globals: true,
    env: loadEnv('test', process.cwd(), ''),
    testTimeout: 30000, // 30 seconds
    hookTimeout: 30000,
    sequence: process.env.SEED ? {
      shuffle: false,
      concurrent: false
    } : {
      shuffle: false,
      concurrent: true
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}); 