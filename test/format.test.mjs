import test from 'node:test';
import assert from 'node:assert/strict';

import mdFormat, {
  DEFAULT_OPTIONS,
  formatMarkdownText,
  mergeOptions,
  remarkMdFormat,
} from '../src/index.ts';

test('formats Chinese technical prose with default options', () => {
  assert.equal(
    formatMarkdownText('中文Astro和latex, 测试. 版本UTF-8不要拆'),
    '中文 Astro 和 LaTeX，测试。版本 UTF-8 不要拆',
  );
});

test('can disable individual spacing and punctuation options', () => {
  assert.equal(
    formatMarkdownText('中文Astro,测试', {
      spaceBetweenCJKAndEnglish: false,
      normalizePunctuation: false,
    }),
    '中文Astro,测试',
  );
});

test('normalizes full-width technical terms before applying term replacements', () => {
  assert.equal(formatMarkdownText('使用ａｓｔｒｏ和ＨＴＭＬ'), '使用 Astro 和 HTML');
});

test('spaces CJK text around links, inline code, and inline math nodes', () => {
  const tree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: '阅读' },
          { type: 'link', url: 'https://example.com', children: [{ type: 'text', value: 'Docs' }] },
          { type: 'text', value: '后运行' },
          { type: 'inlineCode', value: 'npm run build' },
          { type: 'text', value: '得到' },
          { type: 'inlineMath', value: 'E=mc^2' },
          { type: 'text', value: '公式' },
        ],
      },
    ],
  };

  remarkMdFormat()(tree);

  assert.deepEqual(tree.children[0].children, [
    { type: 'text', value: '阅读 ' },
    { type: 'link', url: 'https://example.com', children: [{ type: 'text', value: 'Docs' }] },
    { type: 'text', value: ' 后运行 ' },
    { type: 'inlineCode', value: 'npm run build' },
    { type: 'text', value: ' 得到 ' },
    { type: 'inlineMath', value: 'E=mc^2' },
    { type: 'text', value: ' 公式' },
  ]);
});

test('merges options without mutating defaults', () => {
  const merged = mergeOptions({ compressPunctuation: false });

  assert.equal(merged.compressPunctuation, false);
  assert.equal(DEFAULT_OPTIONS.compressPunctuation, true);
});

test('exports an Astro integration that injects the remark plugin', () => {
  const integration = mdFormat({ spaceBetweenCJKAndCode: false });
  const calls = [];

  integration.hooks['astro:config:setup']({
    updateConfig: (config) => calls.push(config),
  });

  assert.equal(integration.name, '@cavillxu/astro-md-format');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].markdown.remarkPlugins.length, 1);
  assert.equal(calls[0].markdown.remarkPlugins[0][1].spaceBetweenCJKAndCode, false);
});
