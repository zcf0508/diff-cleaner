import { describe, expect, it } from 'vitest';
import { DiffCleaner } from '../src/index';

describe('DiffCleaner: End-to-End', () => {
  const cleaner = new DiffCleaner();

  it('should clean whitespace-only changes', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
-const a = 1;
+const a  =  1;
  const b = 2;`;

    const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    // Change is identified as formatting-only
    expect(result.formatChanges.length).toBe(1);
    expect(result.formatChanges[0].type).toBe('whitespace');

    // Reconstructed diff should be empty since the only change was filtered
    expect(reconstructed.trim()).toBe('');
  });

  it('should clean comment-only changes', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
-// old comment
+// new comment
  const a = 1;`;

    const result = cleaner.clean(rawDiff, { ignoreCommentChanges: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    expect(result.formatChanges.some(c => c.type === 'comment')).toBe(true);
    expect(reconstructed.trim()).toBe('');
  });

  it('should keep meaningful changes while cleaning format changes', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,5 +1,5 @@
-const a = 1;
+const a  =  1;
-const b = 2;
+const b = 3;
  const c = 4;`;

    const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    // Whitespace change is filtered, but b = 3 should remain
    expect(reconstructed).toMatchInlineSnapshot(`
      "diff --git a/test.ts b/test.ts
      --- a/test.ts
      +++ b/test.ts
      @@ -1,3 +1,3 @@
       const a  =  1;
      -const b = 2;
      +const b = 3;
        const c = 4;"
    `);
  });

  it('should clean single-side blank line changes', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,4 @@
 const a = 1;
+
 const b = 2;`;

    const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    expect(result.formatChanges.some(c => c.type === 'whitespace')).toBe(true);
    expect(reconstructed.trim()).toBe('');
  });

  it('should clean line-wrapping changes when tokens are unchanged', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,3 @@
-const config = defineConfig({ test: 'a' });
+const config = defineConfig(
+  { test: 'a' },
+);`;

    const result = cleaner.clean(rawDiff, { ignoreLineWrappingChanges: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    expect(result.formatChanges.some(c => c.type === 'line-wrap')).toBe(true);
    expect(reconstructed.trim()).toMatchInlineSnapshot('""');
  });

  it('should keep line-wrapping changes when tokens changed', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,3 @@
-const config = defineConfig({ test: 'a' });
+const config = defineConfig(
+  { test: 'b' },
+);`;

    const result = cleaner.clean(rawDiff, { ignoreLineWrappingChanges: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    expect(result.formatChanges.length).toBe(0);
    expect(reconstructed).toMatchInlineSnapshot(`
      "diff --git a/test.ts b/test.ts
      --- a/test.ts
      +++ b/test.ts
      @@ -1,1 +1,3 @@
      -const config = defineConfig({ test: 'a' });
      +const config = defineConfig(
      +  { test: 'b' },
      +);"
    `);
  });

  it('should keep meaningful changes in a mixed diff with line-wrapping', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,5 +1,7 @@
-const config = defineConfig({ test: 'a' });
+const config = defineConfig(
+  { test: 'a' },
+);
 const untouched = true;
-const value = 1;
+const value = 2;`;

    const result = cleaner.clean(rawDiff, { ignoreLineWrappingChanges: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    expect(result.formatChanges.some(c => c.type === 'line-wrap')).toBe(true);
    expect(reconstructed).toMatchInlineSnapshot(`
      "diff --git a/test.ts b/test.ts
      --- a/test.ts
      +++ b/test.ts
      @@ -1,2 +1,2 @@
       const untouched = true;
      -const value = 1;
      +const value = 2;"
    `);
  });

  describe('Negative & Edge Cases', () => {
    it('should keep line-wrapping changes when template literals are involved', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,3 @@
-const config = defineConfig({ test: \`a \${name}\` });
+const config = defineConfig(
+  { test: \`a \${name}\` },
+);`;

      const result = cleaner.clean(rawDiff, { ignoreLineWrappingChanges: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(result.formatChanges.length).toBe(0);
      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,1 +1,3 @@
        -const config = defineConfig({ test: \`a \${name}\` });
        +const config = defineConfig(
        +  { test: \`a \${name}\` },
        +);"
      `);
    });
    it('should NOT clean quote changes when interpolation is involved', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,2 @@
-const s = "hello";
+const s = \`hello \${name}\`;`;

      const result = cleaner.clean(rawDiff, { ignoreQuoteChanges: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(result.formatChanges.length).toBe(0);
      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,1 +1,1 @@
        -const s = "hello";
        +const s = \`hello \${name}\`;"
      `);
    });

    it('should NOT clean trailing commas in JSON-like content', () => {
      const rawDiff = `diff --git a/test.json b/test.json
--- a/test.json
+++ b/test.json
@@ -1,3 +1,3 @@
 {
-  "a": 1
+  "a": 1,
 }`;

      const result = cleaner.clean(rawDiff, { ignoreTrailingCommas: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(result.formatChanges.length).toBe(0);
      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.json b/test.json
        --- a/test.json
        +++ b/test.json
        @@ -1,3 +1,3 @@
         {
        -  "a": 1
        +  "a": 1,
         }"
      `);
    });

    it('should clean quote changes when it is just a style change', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,2 @@
-const s = 'hello';
+const s = "hello";`;

      const result = cleaner.clean(rawDiff, { ignoreQuoteChanges: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(result.formatChanges.some(c => c.type === 'quote')).toBe(true);
      expect(reconstructed.trim()).toBe('');
    });

    it('should clean trailing commas in JS/TS-like content', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 const arr = [
-  1
+  1,
 ];`;

      const result = cleaner.clean(rawDiff, { ignoreTrailingCommas: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(result.formatChanges.some(c => c.type === 'trailing-comma')).toBe(true);
      expect(reconstructed.trim()).toBe('');
    });

    it('should keep semicolon changes when ASI risk exists', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,2 @@
-foo();
+foo()
 (bar)`;

      const result = cleaner.clean(rawDiff, { ignoreOptionalSemicolons: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(result.formatChanges.length).toBe(0);
      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,2 +1,2 @@
        -foo();
        +foo()
         (bar)"
      `);
    });

    it('should clean import reordering changes', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,2 @@
-import b from 'b';
-import a from 'a';
+import a from 'a';
+import b from 'b';`;

      const result = cleaner.clean(rawDiff, { ignoreImportReordering: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(result.formatChanges.some(c => c.type === 'import')).toBe(true);
      expect(reconstructed.trim()).toBe('');
    });
  });
});
