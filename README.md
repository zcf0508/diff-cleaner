# z-diff-cleaner

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Remove formatting-only changes from git diffs before sending them to LLMs for code review.

## Features

- Detect and remove whitespace-only changes
- Detect comment-only changes
- Detect quote style changes (safe cases only)
- Detect trailing comma changes (non-JSON)
- Detect optional semicolon changes with ASI safety checks
- Detect import reordering when the import set is unchanged

## Install

```bash
npm i z-diff-cleaner
```

## Usage

```ts
import { DiffCleaner } from 'z-diff-cleaner';

const cleaner = new DiffCleaner();

const diffText = `diff --git a/app.ts b/app.ts
@@ -1,2 +1,2 @@
-const a = 1;
+const a  =  1;`;

const result = cleaner.clean(diffText, {
  ignoreWhitespace: true,
  ignoreCommentChanges: true,
  ignoreQuoteChanges: true,
  ignoreTrailingCommas: true,
  ignoreOptionalSemicolons: true,
  ignoreImportReordering: true,
});

const cleanedDiff = cleaner.reconstruct(result.cleaned);
console.log(cleanedDiff);
```

## Configuration

- ignoreWhitespace: Remove whitespace-only changes
- ignoreCommentChanges: Remove comment-only changes
- ignoreImportReordering: Remove import reordering when the set is unchanged
- ignoreLineBreaks: Remove line break changes
- ignoreQuoteChanges: Remove quote style changes when safe
- ignoreTrailingCommas: Remove trailing comma changes in non-JSON
- ignoreOptionalSemicolons: Remove optional semicolons when safe
- language: Language hint for future optimizations

## Output

The clean API returns:

- original: Parsed diff files
- cleaned: Filtered diff files
- formatChanges: Detected formatting changes
- statistics: Summary of files and lines removed

## Development

```bash
npm test
npm run lint
npm run typecheck
```

## License

[MIT](./LICENSE) License © [Huali](https://github.com/zcf0508)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/z-diff-cleaner?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/z-diff-cleaner
[npm-downloads-src]: https://img.shields.io/npm/dm/z-diff-cleaner?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/z-diff-cleaner
