import type { AstroIntegration } from 'astro';

const CJK = '\\u3400-\\u9fff\\uf900-\\ufaff';
const LINK_NODE_TYPES = new Set(['link', 'linkReference']);
const CODE_NODE_TYPES = new Set(['inlineCode']);
const MATH_NODE_TYPES = new Set(['inlineMath']);
const TEXT_CONTAINER_TYPES = new Set([
  'blockquote',
  'delete',
  'emphasis',
  'footnoteDefinition',
  'heading',
  'listItem',
  'paragraph',
  'root',
  'strong',
  'tableCell',
]);

type TermReplacement = {
  pattern: RegExp;
  replacement: string;
};

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  [key: string]: unknown;
};

export type MdFormatOptions = {
  spaceBetweenCJKAndEnglish?: boolean;
  spaceBetweenCJKAndCode?: boolean;
  spaceBetweenCJKAndLink?: boolean;
  spaceBetweenCJKAndMath?: boolean;
  normalizePunctuation?: boolean;
  normalizeFullWidth?: boolean;
  compressPunctuation?: boolean;
  normalizeTerms?: boolean;
  trimParagraphIndent?: boolean;
  termReplacements?: TermReplacement[];
  protectedPatterns?: RegExp[];
};

type ResolvedMdFormatOptions = Required<
  Omit<MdFormatOptions, 'termReplacements' | 'protectedPatterns'>
> & {
  termReplacements: TermReplacement[];
  protectedPatterns: RegExp[];
};

export const DEFAULT_TERM_REPLACEMENTS: TermReplacement[] = [
  { pattern: /\bastro\b/gi, replacement: 'Astro' },
  { pattern: /\bcss\b/g, replacement: 'CSS' },
  { pattern: /\bgithub\b/gi, replacement: 'GitHub' },
  { pattern: /\bhdl\b/g, replacement: 'HDL' },
  { pattern: /\bhtml\b/g, replacement: 'HTML' },
  { pattern: /\bjavascript\b/gi, replacement: 'JavaScript' },
  { pattern: /\bkaggle\b/gi, replacement: 'Kaggle' },
  { pattern: /\blatex\b/gi, replacement: 'LaTeX' },
  { pattern: /\bmarkdown\b/gi, replacement: 'Markdown' },
  { pattern: /\bpagefind\b/gi, replacement: 'Pagefind' },
  { pattern: /\bsql\b/g, replacement: 'SQL' },
  { pattern: /\btypescript\b/gi, replacement: 'TypeScript' },
];

export const DEFAULT_PROTECTED_PATTERNS: RegExp[] = [
  /https?:\/\/[^\s)]+/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /"[^"\n]*[A-Za-z][^"\n]*"/g,
  /\b(?:GPT-\d+(?:\.\d+)?|IPv\d+|LaTeX2e|Nand2Tetris|UTF-\d+|WebGL2)\b/gi,
];

export const DEFAULT_OPTIONS: ResolvedMdFormatOptions = {
  spaceBetweenCJKAndEnglish: true,
  spaceBetweenCJKAndCode: true,
  spaceBetweenCJKAndLink: true,
  spaceBetweenCJKAndMath: true,
  normalizePunctuation: true,
  normalizeFullWidth: true,
  compressPunctuation: true,
  normalizeTerms: true,
  trimParagraphIndent: true,
  termReplacements: DEFAULT_TERM_REPLACEMENTS,
  protectedPatterns: DEFAULT_PROTECTED_PATTERNS,
};

export function mergeOptions(options: MdFormatOptions = {}): ResolvedMdFormatOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    termReplacements: options.termReplacements ?? DEFAULT_OPTIONS.termReplacements,
    protectedPatterns: options.protectedPatterns ?? DEFAULT_OPTIONS.protectedPatterns,
  };
}

function protectSegments(value: string, patterns: RegExp[]) {
  const segments: string[] = [];
  let protectedValue = value;

  for (const pattern of patterns) {
    protectedValue = protectedValue.replace(pattern, (match) => {
      const token = `\uE000${segments.length}\uE001`;
      segments.push(match);

      return token;
    });
  }

  return {
    value: protectedValue,
    restore: (nextValue: string) =>
      nextValue.replace(/\uE000(\d+)\uE001/g, (_, index) => segments[Number(index)] ?? ''),
  };
}

function normalizeTerms(value: string, termReplacements: TermReplacement[]) {
  return termReplacements.reduce((nextValue, { pattern, replacement }) => {
    return nextValue.replace(pattern, replacement);
  }, value);
}

function normalizeFullWidthCharacters(value: string) {
  return value
    .replace(/\u3000/g, ' ')
    .replace(/[\uff01-\uff5e]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xfee0),
    );
}

function normalizeQuotes(value: string) {
  return value
    .replace(new RegExp(`[‘']([^‘’']*[${CJK}][^‘’']*)[’']`, 'g'), '『$1』')
    .replace(new RegExp(`[“"]([^“”"]*[${CJK}][^“”"]*)[”"]`, 'g'), '「$1」');
}

function normalizeChinesePunctuation(value: string) {
  return value
    .replace(new RegExp(`([${CJK}])\\s*,\\s*`, 'g'), '$1，')
    .replace(new RegExp(`\\s*,\\s*([${CJK}])`, 'g'), '，$1')
    .replace(new RegExp(`([${CJK}])\\s*;\\s*`, 'g'), '$1；')
    .replace(new RegExp(`\\s*;\\s*([${CJK}])`, 'g'), '；$1')
    .replace(new RegExp(`([${CJK}])\\s*:\\s*`, 'g'), '$1：')
    .replace(new RegExp(`\\s*:\\s*([${CJK}])`, 'g'), '：$1')
    .replace(new RegExp(`([${CJK}])\\s*!\\s*`, 'g'), '$1！')
    .replace(new RegExp(`\\s*!\\s*([${CJK}])`, 'g'), '！$1')
    .replace(new RegExp(`([${CJK}])\\s*\\?\\s*`, 'g'), '$1？')
    .replace(new RegExp(`\\s*\\?\\s*([${CJK}])`, 'g'), '？$1')
    .replace(new RegExp(`([${CJK}])\\s*\\.\\s*`, 'g'), '$1。')
    .replace(new RegExp(`\\s*\\.\\s*([${CJK}])`, 'g'), '。$1')
    .replace(/([，。！？；：、])\s+([A-Za-z0-9])/g, '$1$2')
    .replace(/([A-Za-z0-9])\s+([，。！？；：、])/g, '$1$2');
}

function compressPunctuationRuns(value: string) {
  return value
    .replace(/([，。！？；：、])\1+/g, '$1')
    .replace(/([,!?;:])\1+/g, '$1')
    .replace(/\.{4,}/g, '...')
    .replace(/[ \t]{2,}/g, ' ');
}

function addCjkAsciiSpacing(value: string) {
  const cjkToAscii = new RegExp(`([${CJK}])([A-Za-z0-9])`, 'g');
  const asciiToCjk = new RegExp(`([A-Za-z0-9])([${CJK}])`, 'g');

  return value.replace(cjkToAscii, '$1 $2').replace(asciiToCjk, '$1 $2');
}

function addScriptSpacing(value: string) {
  return addCjkAsciiSpacing(value)
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/[ \t]{2,}/g, ' ');
}

export function formatMarkdownText(value: string, options: MdFormatOptions = {}) {
  const resolvedOptions = mergeOptions(options);
  const fullWidthNormalizedValue = resolvedOptions.normalizeFullWidth
    ? normalizeFullWidthCharacters(value)
    : value;
  const termNormalizedValue = resolvedOptions.normalizeTerms
    ? normalizeTerms(fullWidthNormalizedValue, resolvedOptions.termReplacements)
    : fullWidthNormalizedValue;
  const protectedSegments = protectSegments(termNormalizedValue, resolvedOptions.protectedPatterns);
  let nextValue = normalizeQuotes(protectedSegments.value);

  if (resolvedOptions.normalizePunctuation) {
    nextValue = normalizeChinesePunctuation(nextValue);
  }

  if (resolvedOptions.compressPunctuation) {
    nextValue = compressPunctuationRuns(nextValue);
  }

  if (resolvedOptions.spaceBetweenCJKAndEnglish) {
    nextValue = addScriptSpacing(nextValue);
  }

  const restoredValue = protectedSegments.restore(nextValue);
  const spacedValue = resolvedOptions.spaceBetweenCJKAndEnglish
    ? addCjkAsciiSpacing(restoredValue)
    : restoredValue;

  return spacedValue.replace(/[ \t]{2,}/g, ' ');
}

function trimParagraphIndent(children: MarkdownNode[]) {
  const firstChild = children[0];

  if (firstChild?.type === 'text' && typeof firstChild.value === 'string') {
    firstChild.value = firstChild.value.replace(/^[\t \u3000]+/, '');
  }
}

function getPlainText(node: MarkdownNode): string {
  if (node.type === 'text' || CODE_NODE_TYPES.has(node.type) || MATH_NODE_TYPES.has(node.type)) {
    return typeof node.value === 'string' ? node.value : '';
  }

  if (!Array.isArray(node.children)) {
    return '';
  }

  return node.children.map(getPlainText).join('');
}

function startsWithTextCharacter(node: MarkdownNode) {
  return /^[A-Za-z0-9\u3400-\u9fff\uf900-\ufaff]/.test(getPlainText(node));
}

function endsWithTextCharacter(node: MarkdownNode) {
  return /[A-Za-z0-9\u3400-\u9fff\uf900-\ufaff]$/.test(getPlainText(node));
}

function appendTextNode(children: MarkdownNode[], index: number, value: string) {
  const child = children[index];

  if (child?.type === 'text' && typeof child.value === 'string') {
    child.value += value;
    return;
  }

  children.splice(index + 1, 0, { type: 'text', value });
}

function prependTextNode(children: MarkdownNode[], index: number, value: string) {
  const child = children[index];

  if (child?.type === 'text' && typeof child.value === 'string') {
    child.value = `${value}${child.value}`;
    return;
  }

  children.splice(index, 0, { type: 'text', value });
}

function shouldSpaceInlineNode(node: MarkdownNode, options: ResolvedMdFormatOptions) {
  if (LINK_NODE_TYPES.has(node.type)) {
    return options.spaceBetweenCJKAndLink;
  }

  if (CODE_NODE_TYPES.has(node.type)) {
    return options.spaceBetweenCJKAndCode;
  }

  if (MATH_NODE_TYPES.has(node.type)) {
    return options.spaceBetweenCJKAndMath;
  }

  return false;
}

function addInlineNodeSpacing(children: MarkdownNode[], options: ResolvedMdFormatOptions) {
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (!child || !shouldSpaceInlineNode(child, options)) {
      continue;
    }

    const previousChild = children[index - 1];
    if (previousChild && endsWithTextCharacter(previousChild)) {
      appendTextNode(children, index - 1, ' ');
    }

    const nextChild = children[index + 1];
    if (nextChild && startsWithTextCharacter(nextChild)) {
      prependTextNode(children, index + 1, ' ');
    }
  }
}

function transformNode(node: MarkdownNode, options: ResolvedMdFormatOptions) {
  if (node.type === 'text' && typeof node.value === 'string') {
    node.value = formatMarkdownText(node.value, options);
    return;
  }

  if (!Array.isArray(node.children) || !TEXT_CONTAINER_TYPES.has(node.type)) {
    return;
  }

  for (const child of node.children) {
    transformNode(child, options);
  }

  if (node.type === 'paragraph' && options.trimParagraphIndent) {
    trimParagraphIndent(node.children);
  }

  addInlineNodeSpacing(node.children, options);
}

export function remarkMdFormat(options: MdFormatOptions = {}) {
  const resolvedOptions = mergeOptions(options);

  return (tree: MarkdownNode) => {
    transformNode(tree, resolvedOptions);
  };
}

export default function mdFormat(options: MdFormatOptions = {}): AstroIntegration {
  const resolvedOptions = mergeOptions(options);

  return {
    name: '@cavillxu/astro-md-format',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          markdown: {
            remarkPlugins: [[remarkMdFormat, resolvedOptions]],
          },
        });
      },
    },
  };
}
