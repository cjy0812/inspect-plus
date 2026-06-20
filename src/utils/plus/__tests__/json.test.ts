/**
 * JSON5 容错解析器测试
 *
 * 验证目标：
 * - stripNoise 能否正确清理 Markdown 包裹、BOM、行号、import 语句
 * - extractAllJsonBlocks 能否从混合文本中提取独立的 JSON/对象块
 * - cleanBlockSyntax 能否擦除 TS 类型断言、导出语句
 * - tryParseJSON5Tolerant 端到端：从脏文本到解析结果的完整容错链路
 */
import { describe, expect, it } from 'vitest';
import {
  normalizeLooseJsonLikeText,
  tryParseJSON5Tolerant,
} from '@/utils/plus/json';

describe('json utils', () => {
  // ---- normalizeLooseJsonLikeText ----

  describe('normalizeLooseJsonLikeText', () => {
    it('strips markdown code block wrapper', () => {
      const input = '```javascript\n{ "key": "value" }\n```';
      const result = normalizeLooseJsonLikeText(input);
      expect(result).not.toContain('```');
      expect(result).toContain('"key"');
    });

    it('strips Unicode BOM', () => {
      const input = '\uFEFF{ "key": "value" }';
      const result = normalizeLooseJsonLikeText(input);
      expect(result).not.toContain('\uFEFF');
    });

    it('strips line-number prefixes', () => {
      const input = '1 | { "key": "value" }';
      const result = normalizeLooseJsonLikeText(input);
      expect(result).not.toContain('1 |');
      expect(result).toContain('"key"');
    });

    it('strips diff symbols', () => {
      const input = '+ { "key": "value" }';
      const result = normalizeLooseJsonLikeText(input);
      expect(result).not.toContain('+ ');
    });

    it('strips import statements', () => {
      const input = 'import { foo } from "bar";\n{ "key": "value" }';
      const result = normalizeLooseJsonLikeText(input);
      expect(result).not.toContain('import');
    });
  });

  // ---- tryParseJSON5Tolerant ----

  describe('tryParseJSON5Tolerant', () => {
    it('returns error for empty input', () => {
      expect(tryParseJSON5Tolerant('')).toHaveProperty('error');
      expect(tryParseJSON5Tolerant('   ')).toHaveProperty('error');
    });

    it('parses plain JSON object', () => {
      const result = tryParseJSON5Tolerant('{ "key": "value" }');
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual({ key: 'value' });
    });

    it('parses JSON5 trailing commas', () => {
      const result = tryParseJSON5Tolerant('{ "key": "value", }');
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual({ key: 'value' });
    });

    it('parses object wrapped in markdown code block', () => {
      const input = '```json\n{ "name": "test" }\n```';
      const result = tryParseJSON5Tolerant(input);
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual({ name: 'test' });
    });

    it('parses defineGkdApp() call', () => {
      const input = 'defineGkdApp({ "id": 1 })';
      const result = tryParseJSON5Tolerant(input);
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual({ id: 1 });
    });

    it('strips "export default" prefix', () => {
      const input = 'export default { "id": 1 }';
      const result = tryParseJSON5Tolerant(input);
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual({ id: 1 });
    });

    it('strips TS "as const" assertion', () => {
      const input = '{ "id": 1 } as const';
      const result = tryParseJSON5Tolerant(input);
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual({ id: 1 });
    });

    it('strips variable assignment', () => {
      const input = 'const config = { "id": 1 }';
      const result = tryParseJSON5Tolerant(input);
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual({ id: 1 });
    });

    it('returns error when no valid structure found', () => {
      const result = tryParseJSON5Tolerant('just some random text');
      expect(result).toHaveProperty('error');
    });

    it('parses array and flattens into results', () => {
      const input = '[{ "id": 1 }, { "id": 2 }]';
      const result = tryParseJSON5Tolerant(input);
      expect(result).toHaveProperty('value');
      expect(result.value).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('returns single object when only one block is found', () => {
      const result = tryParseJSON5Tolerant('{ "a": 1 }');
      expect(result).toHaveProperty('value');
      expect(Array.isArray(result.value)).toBe(false);
    });

    it('returns array when multiple blocks are found', () => {
      const input = '{ "a": 1 }\n{ "b": 2 }';
      const result = tryParseJSON5Tolerant(input);
      expect(result).toHaveProperty('value');
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value).toEqual([{ a: 1 }, { b: 2 }]);
    });
  });
});
