import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import process from 'node:process';
import { defineConfig } from 'vitest/config';
import unocss from 'unocss/vite';
import data from 'unplugin-data/vite';
import { unAutoImport } from './plugins';

export default defineConfig(async () => {
  return {
    plugins: [
      vue(),
      vueJsx(),
      unocss({ inspector: false }),
      await unAutoImport(),
      data(),
    ],
    resolve: {
      alias: {
        '@': process.cwd() + '/src',
      },
    },
    test: {
      environment: 'happy-dom',
      include: ['src/**/*.test.ts'],
      testTimeout: 10000,
    },
  };
});
