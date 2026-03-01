import { computed, type ShallowRef } from 'vue';
import { getNodeQf } from '@/utils/node';

interface QuickFindMeta {
  self: boolean;
  has: boolean;
}

export const useWindowQuickFind = (rootNode: ShallowRef<RawNode>) => {
  const metaMap = computed(() => {
    const root = rootNode.value;
    if (!root) return new Map<number, QuickFindMeta>();

    const map = new Map<number, QuickFindMeta>();
    const walk = (node: RawNode): QuickFindMeta => {
      const self = getNodeQf(node);
      let has = self;
      for (const child of node.children) {
        if (walk(child).has) has = true;
      }
      const meta = { self, has };
      map.set(node.id, meta);
      return meta;
    };
    walk(root);
    return map;
  });

  const getNodeQuickFindMeta = (node: RawNode) => {
    return metaMap.value.get(node.id);
  };

  return {
    getNodeQuickFindMeta,
  };
};
