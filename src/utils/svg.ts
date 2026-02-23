const modules = import.meta.glob<string>('@/assets/svg/*.svg', {
  eager: true,
  query: 'raw',
  import: 'default',
});

export default Object.fromEntries(
  Object.entries(modules)
    .map(([k, v]) => {
      const name = k.split('/').at(-1)!.split('.')[0];
      const t = document.createElement('template');
      t.innerHTML = v;
      const el = t.content.firstElementChild as SVGSVGElement | null;
      if (!el) return null;
      return [name, el] as const;
    })
    .filter((item): item is readonly [string, SVGSVGElement] => !!item),
);
