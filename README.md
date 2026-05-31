# @xjn2005/astro-md-format

一个面向中文技术博客的 Astro Markdown 排版插件。它会在 Astro 构建 Markdown / MDX 内容时，通过 remark AST 处理正文文本，让中文、英文、链接、行内代码、LaTeX 和标点的排版更稳定。

## 安装

```bash
npm install @xjn2005/astro-md-format
```

也可以在本地开发时直接从项目内引入：

```js
import mdFormat from './packages/astro-md-format';
```

## 使用方式

在 `astro.config.mjs` 中加入 integration：

```js
import { defineConfig } from 'astro/config';
import mdFormat from '@xjn2005/astro-md-format';

export default defineConfig({
  integrations: [
    mdFormat({
      // options here
    }),
  ],
});
```

如果使用本地包：

```js
import { defineConfig } from 'astro/config';
import mdFormat from './packages/astro-md-format';

export default defineConfig({
  integrations: [mdFormat()],
});
```

插件也导出了纯文本处理函数和 remark 插件，便于测试或在其它 Markdown 流程里复用：

```js
import { formatMarkdownText, remarkMdFormat } from '@xjn2005/astro-md-format';
```

## 配置项

默认配置适合中文技术博客。

| 选项                        | 默认值       | 说明                                                                      |
| --------------------------- | ------------ | ------------------------------------------------------------------------- |
| `spaceBetweenCJKAndEnglish` | `true`       | 在中文与英文、数字之间自动加空格，同时处理英文与数字的紧邻情况。          |
| `spaceBetweenCJKAndCode`    | `true`       | 在中文与 Markdown inline code 节点之间自动加空格。                        |
| `spaceBetweenCJKAndLink`    | `true`       | 在中文与 Markdown 链接节点之间自动加空格。                                |
| `spaceBetweenCJKAndMath`    | `true`       | 在中文与 inline LaTeX / math 节点之间自动加空格。                         |
| `normalizePunctuation`      | `true`       | 将中文语境中的英文逗号、句号、问号、感叹号等统一为中文标点。              |
| `normalizeFullWidth`        | `true`       | 将全角英文、数字和空格统一为半角形式，中文标点会再按中文语境处理。        |
| `compressPunctuation`       | `true`       | 压缩重复标点和多余空格。                                                  |
| `normalizeTerms`            | `true`       | 统一常见技术词大小写，例如 `github` -> `GitHub`、`latex` -> `LaTeX`。     |
| `trimParagraphIndent`       | `true`       | 移除段落开头的普通空格、Tab 和全角空格。                                  |
| `termReplacements`          | 内置技术词表 | 自定义术语替换规则，格式为 `{ pattern: RegExp, replacement: string }[]`。 |
| `protectedPatterns`         | 内置保护规则 | 保护 URL、邮箱和部分技术标识，避免被空格规则拆开。                        |

示例：

```js
mdFormat({
  spaceBetweenCJKAndCode: true,
  spaceBetweenCJKAndMath: true,
  compressPunctuation: true,
});
```

## Before / After

输入：

```md
中文Astro博客里使用`npm run build`生成HTML, 也可以写$E=mc^2$公式。
请阅读[Astro Docs](https://docs.astro.build)后继续。
```

输出：

```md
中文 Astro 博客里使用 `npm run build` 生成 HTML，也可以写 $E=mc^2$ 公式。
请阅读 [Astro Docs](https://docs.astro.build) 后继续。
```

## 适用场景

- 中文技术博客、课程笔记、开发文档。
- Markdown / MDX 中经常混用中文、英文术语、数字、链接、inline code 和 LaTeX。
- 希望在构建阶段统一排版，而不是手动逐篇修改正文。

## License

MIT
