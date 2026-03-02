import JSON5 from 'json5';

const stripCodeFence = (text: string) => {
  return text
    .replace(/^\s*```[a-zA-Z0-9_-]*\s*\n?/, '')
    .replace(/\n?\s*```\s*$/g, '');
};

const stripLinePrefixNoise = (text: string) => {
  const lines = text.split(/\r?\n/);
  const plusMinusLike = lines.filter((line) => /^\s*[+-]\s/.test(line)).length;
  const hasDiffNoise = plusMinusLike > 0 && plusMinusLike / lines.length > 0.3;
  return lines
    .map((line) => {
      let next = line.replace(/^\s*\d+\s*[|:]\s*/, '');
      if (hasDiffNoise) {
        next = next.replace(/^\s*[+-]\s/, '');
      }
      return next;
    })
    .join('\n');
};

const stripTsFrame = (text: string) => {
  let next = text;
  next = next.replace(/^\uFEFF/, '');
  next = next.replace(/^\s*export\s+default\s+/, '');
  next = next.replace(/^\s*(const|let|var)\s+\w+\s*=\s*/, '');
  next = next.replace(/\s+as\s+const\b/g, '');
  next = next.replace(/\s+as\s+[A-Za-z_$][^,\n;)}\]]*/g, '');
  next = next.replace(/,\s*([}\]])/g, '$1');
  return next;
};

export const normalizeLooseJsonLikeText = (rawText: string) => {
  const text = String(rawText ?? '');
  return stripTsFrame(stripLinePrefixNoise(stripCodeFence(text))).trim();
};

/**
 * 尝试以 JSON5 解析文本，并在失败时做容错提取：
 * - 从首个 `{` 或 `[` 开始提取完整结构
 * - 兼容字符串、注释、缺失前后包裹文本
 * - 最后尝试包一层数组解析（兼容缺失括号等输入）
 */
export function tryParseJSON5Tolerant(rawText: string): {
  value?: any;
  error?: Error;
} {
  let text = String(rawText ?? '');
  if (!text.trim()) return { error: new Error('空输入') };

  // 预处理：去除末尾多余的逗号
  text = text.trim();
  if (text.endsWith(',')) {
    text = text.slice(0, -1).trim();
  }

  // 预处理：去除字符串中的反引号
  text = text.replace(/`/g, '');

  try {
    return { value: JSON5.parse(text) };
  } catch {
    // 继续容错
  }

  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  const starts: { i: number; c: '{' | '[' }[] = [];
  if (firstBrace !== -1) starts.push({ i: firstBrace, c: '{' });
  if (firstBracket !== -1) starts.push({ i: firstBracket, c: '[' });

  if (starts.length) {
    starts.sort((a, b) => a.i - b.i);
    for (const s of starts) {
      const open = s.c;
      const close = open === '{' ? '}' : ']';
      let depth = 0;
      let inStr = false;
      let strChar = '';
      let escaped = false;
      let inLineComment = false;
      let inBlockComment = false;
      const startIndex = s.i;
      let endIndex = -1;

      for (let i = startIndex; i < text.length; i++) {
        const ch = text[i];
        const nextCh = text[i + 1] || '';

        if (inBlockComment) {
          if (ch === '*' && nextCh === '/') {
            inBlockComment = false;
            i++;
          }
          continue;
        }

        if (inLineComment) {
          if (ch === '\n') {
            inLineComment = false;
          }
          continue;
        }

        if (inStr) {
          if (escaped) escaped = false;
          else if (ch === '\\') escaped = true;
          else if (ch === strChar) {
            inStr = false;
            strChar = '';
          }
          continue;
        }

        if (ch === '/' && nextCh === '/') {
          inLineComment = true;
          i++;
          continue;
        }
        if (ch === '/' && nextCh === '*') {
          inBlockComment = true;
          i++;
          continue;
        }

        if (ch === '"' || ch === "'") {
          inStr = true;
          strChar = ch;
          continue;
        }

        if (ch === open) depth++;
        else if (ch === close) {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex > 0) {
        const candidate = text.substring(startIndex, endIndex + 1);
        try {
          return { value: JSON5.parse(candidate) };
        } catch {
          // try next
        }
      }
    }
  }

  try {
    return { value: JSON5.parse(`[${text}]`) };
  } catch (e) {
    return { error: e as Error };
  }
}
