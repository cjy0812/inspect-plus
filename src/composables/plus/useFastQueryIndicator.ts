import { FastQuery } from '@gkd-kit/selector';

export type FastQueryMeta = { support: boolean; local: boolean };

export const getFastQuerySupport = (result: SearchResult): boolean => {
  if (!result.gkd || !result.selector.fastQueryList.length) return false;
  const { fastQueryList } = result.selector;

  const resultsArray = Array.isArray(result.results)
    ? result.results
    : Array.from(
        result.results as unknown as Iterable<{
          context: { toArray: () => RawNode[] };
        }>,
      );

  const canFastQueryNode = (node: RawNode) => {
    const idOk =
      (node.quickFind || node.idQf) &&
      node.attr.id &&
      fastQueryList.some(
        (query) =>
          query instanceof FastQuery.Id && query.acceptText(node.attr.id!),
      );
    const vidOk =
      (node.quickFind || node.idQf) &&
      node.attr.vid &&
      fastQueryList.some(
        (query) =>
          query instanceof FastQuery.Vid && query.acceptText(node.attr.vid!),
      );
    const textOk =
      (node.quickFind || node.textQf) &&
      node.attr.text &&
      fastQueryList.some(
        (query) =>
          query instanceof FastQuery.Text && query.acceptText(node.attr.text!),
      );
    return idOk || vidOk || textOk;
  };

  return resultsArray.some((r) =>
    r.context.toArray().some((node) => canFastQueryNode(node)),
  );
};

export const isLocalFastQuery = (result: SearchResult): boolean => {
  if (!result.gkd) return false;
  return result.selector.source.includes('<<');
};

export const buildFastQueryMeta = (
  result: SearchResult,
): FastQueryMeta | null => {
  if (!result.gkd) return null;
  return {
    support: getFastQuerySupport(result),
    local: isLocalFastQuery(result),
  };
};
