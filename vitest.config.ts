import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import process from 'node:process';
import { defineConfig } from 'vitest/config';
import unocss from 'unocss/vite';
import data from 'unplugin-data/vite';
import autoImport from 'unplugin-auto-import/vite';
import components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    unocss({ inspector: false }),
    data(),
    autoImport({
      dts: process.cwd() + '/auto-import.d.ts',
      imports: ['vue', 'vue-router', '@vueuse/core'],
      dirs: [process.cwd() + '/src/store/**'],
    }),
    components({
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
      dts: process.cwd() + '/auto-import-components.d.ts',
      resolvers: [NaiveUiResolver()],
      dirs: [],
    }),
  ],
  resolve: {
    alias: {
      '@': process.cwd() + '/src',
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.git'],
    testTimeout: 10000,
    hookTimeout: 10000,
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.git/',
        '**/*.d.ts',
        '**/main.ts',
        '**/router.ts',
        '**/store/*.ts',
      ],
    },
    globals: true,
    passWithNoTests: true,
    outputFile: {
      junit: './test-results/junit.xml',
    },
  },
});
