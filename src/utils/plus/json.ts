import JSON5 from 'json5';

/**
 * 第一步：基础噪音清理
 * 处理 Markdown 代码块、BOM、行号、Diff 符号、import 语句等
 */
const stripNoise = (rawText: string): string => {
  let text = rawText.trim();

  // 1. 移除 Markdown 代码块包裹 (```javascript ... ```)
  text = text
    .replace(/^\s*```[a-zA-Z0-9_-]*\s*\n?/, '')
    .replace(/\n?\s*```\s*$/g, '');

  // 2. 移除 Unicode BOM 头
  text = text.replace(/^\uFEFF/, '');

  // 3. 逐行清理：移除行首数字编号 (如 "1 | ") 或 Diff 符号 (如 "+ ")
  const lines = text.split(/\r?\n/);
  text = lines
    .map((line) => line.replace(/^\s*(\d+\s*[|:]|[+-])\s/, ''))
    .join('\n');

  // 4. 移除所有的 import 语句
  text = text.replace(/(?:^|\n)\s*import\s+[^;]+;\s*/g, '');

  return text.trim();
};

/**
 * 第二步：全量结构提取引擎
 * 核心逻辑：循环扫描文本，识别并提取所有独立的 {对象}、[数组] 或 defineGkdApp(参数)
 */
const extractAllJsonBlocks = (text: string): string[] => {
  const blocks: string[] = [];
  let i = 0;

  while (i < text.length) {
    const nextBrace = text.indexOf('{', i);
    const nextBracket = text.indexOf('[', i);
    const nextFn = text.indexOf('defineGkdApp', i);

    const indices = [nextBrace, nextBracket, nextFn].filter(
      (idx) => idx !== -1,
    );
    if (indices.length === 0) break;

    let start = Math.min(...indices);
    let openChar = text[start];

    // 解决 "Assigned value is not used" 警告：直接声明不赋初始空值
    let closeChar: string;

    // 处理函数调用情况
    if (openChar === 'd') {
      const parenStart = text.indexOf('(', start);
      if (parenStart === -1) {
        i = start + 12; // 跳过关键字继续寻找
        continue;
      }
      start = parenStart;
      openChar = '(';
      closeChar = ')';
    } else {
      closeChar = openChar === '{' ? '}' : ']';
    }

    let depth = 0;
    let inStr = false;
    let strChar = '';
    let escaped = false;
    let found = false;

    for (let j = start; j < text.length; j++) {
      const char = text[j];

      // 处理字符串内部逻辑，防止括号干扰
      if (inStr) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === strChar) {
          inStr = false;
        }
        continue;
      }

      if (char === '"' || char === "'" || char === '`') {
        inStr = true;
        strChar = char;
        continue;
      }

      // 括号深度计数
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          // 提取闭合结构内部的内容
          let content = text.substring(start, j + 1);
          // 如果是函数调用提取的内容，剥离最外层的 ()
          if (openChar === '(') {
            content = content.substring(1, content.length - 1).trim();
          }
          if (content) blocks.push(content);
          i = j + 1;
          found = true;
          break;
        }
      }
    }

    if (!found) i = start + 1;
  }
  return blocks;
};

/**
 * 第三步：清洗具体的块内容
 * 擦除 TS 特有的类型断言、导出语句等
 */
const cleanBlockSyntax = (text: string): string => {
  return (
    text
      .replace(/^\s*export\s+default\s+/, '')
      .replace(/^\s*(const|let|var)\s+\w+\s*=\s*/, '')
      // 移除 TS 断言，如 as const, as any, as AppConfig[]
      .replace(/\s+as\s+const\b/g, '')
      .replace(/\s+as\s+[A-Za-z_$][A-Za-z0-9_$<>[\]]*/g, '')
      // 去除闭合前多余逗号
      .replace(/,\s*([}\]])/g, '$1')
      // 去除行尾孤立逗号
      .replace(/,\s*$/g, '')
      .trim()
  );
};

const repairCommonBrokenTail = (text: string): string => {
  return (
    text
      // 清理常见“残缺复制”尾巴
      .replace(/}\s*,\s*]\s*,\s*}\s*,?\s*$/g, '}]}')
      .replace(/]\s*,\s*}\s*,?\s*$/g, ']}')
      .replace(/}\s*,?\s*$/g, '}')
      .trim()
  );
};

/**
 * 松散 JSON 文本规范化
 */
export function normalizeLooseJsonLikeText(text: string): string {
  return stripNoise(text);
}

/**
 * 暴露给外部的终极容错解析器
 */
export function tryParseJSON5Tolerant(rawText: string): {
  value?: any;
  error?: Error;
} {
  if (!rawText || !rawText.trim()) {
    return { error: new Error('输入内容为空') };
  }

  try {
    // 1. 预处理噪音
    const noisyText = repairCommonBrokenTail(stripNoise(rawText));

    // 2. 提取所有可能的 JSON/TS 对象块
    const blocks = extractAllJsonBlocks(noisyText);

    if (blocks.length === 0) {
      return { error: new Error('未能从文本中识别出任何有效的规则结构') };
    }

    const results: any[] = [];
    let lastError: Error | null = null;

    // 3. 遍历并解析所有提取到的块
    for (const block of blocks) {
      try {
        const cleaned = cleanBlockSyntax(block);
        const parsed = JSON5.parse(cleaned);

        // 如果解析结果是数组，平铺存入结果集
        if (Array.isArray(parsed)) {
          results.push(...parsed);
        } else if (parsed && typeof parsed === 'object') {
          results.push(parsed);
        }
      } catch (e: any) {
        lastError = e;
      }
    }

    // 4. 最终结果汇总
    if (results.length === 0) {
      return {
        error: new Error(
          `解析失败: ${lastError?.message || '语法错误'}。请检查括号、逗号是否完整。`,
        ),
      };
    }

    // 返回单对象或对象数组
    return { value: results.length === 1 ? results[0] : results };
  } catch (globalError: any) {
    return { error: new Error(`解析发生未知错误: ${globalError.message}`) };
  }
}
