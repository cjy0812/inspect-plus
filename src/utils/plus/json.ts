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

  // 4. 移除所有的 import 语句 (支持单行或多行 import)
  text = text.replace(/(?:^|\n)\s*import\s+[^;]+;\s*/g, '');

  return text.trim();
};

/**
 * 第二步：结构提取引擎
 * 核心逻辑：通过栈计数寻找第一个闭合的 { } 或 [ ]
 * 能够自动忽略开头的碎片（如 "}, ],"）和末尾的脏数据（如 ");"）
 */
const extractFirstStructure = (text: string): string | null => {
  let start = -1;
  let openChar = '';
  let closeChar = '';

  // 寻找第一个结构起点
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') {
      start = i;
      openChar = text[i];
      closeChar = openChar === '{' ? '}' : ']';
      break;
    }
  }

  if (start === -1) return null;

  let depth = 0;
  let inStr = false;
  let strChar = '';
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    // 处理字符串内部，防止字符串里的括号干扰计数
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

    // 检测字符串起点（支持双引号、单引号和反引号）
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
        // 找到第一个完整匹配的闭合结构，立即截断返回
        return text.substring(start, i + 1);
      }
    }
  }

  return null; // 未能找到闭合结构
};

/**
 * 第三步：TS 语法清洗
 * 擦除 TS 特有的类型断言，且不会引起 ESLint 报错
 */
const cleanTsSyntax = (text: string): string => {
  return (
    text
      // 移除 "as const"
      .replace(/\s+as\s+const\b/g, '')
      // 移除 "as Type" 或 "as Type[]"，修复了 eslint no-useless-escape 的反斜杠报错
      .replace(/\s+as\s+[A-Za-z_$][A-Za-z0-9_$<>[\]]*/g, '')
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
  error?: string;
} {
  if (!rawText || !rawText.trim()) {
    return { error: '输入内容为空' };
  }

  try {
    // 1. 预处理噪音
    const noisyText = stripNoise(rawText);

    // 2. 尝试提取有效的 JSON 结构
    const structure = extractFirstStructure(noisyText);

    if (!structure) {
      return {
        error: '未能从文本中识别出任何有效的 { 对象 } 或 [ 数组 ] 结构',
      };
    }

    // 3. 清理 TS 类型干扰并使用 JSON5 解析
    const finalCleanText = cleanTsSyntax(structure);

    try {
      const parsed = JSON5.parse(finalCleanText);
      return { value: parsed };
    } catch (parseError: any) {
      // 提供具体的解析错误位置和原因
      return {
        error: `JSON5 解析失败: ${parseError.message}。请检查代码语法（如括号、逗号是否完整）。`,
      };
    }
  } catch (globalError: any) {
    return { error: `解析发生未知错误: ${globalError.message}` };
  }
}
