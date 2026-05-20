import type { Plugin } from 'vite';
export const _404Page = (options: { enabled?: boolean } = {}): Plugin => {
  const enabled = options.enabled ?? true;
  return {
    name: `_404Page`,
    enforce: 'post',
    apply: 'build',
    generateBundle(_, bundle) {
      if (!enabled) return;
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: Reflect.get(bundle['index.html'], 'source'),
      });
    },
  };
};
