import { describe, expect, it } from 'vitest';
import { DiffCleaner } from '../src/index';

describe('Comprehensive Formatting Tests: Whitespace, Comments, and Pairing', () => {
  const cleaner = new DiffCleaner();

  describe('Whitespace Detector (Positive & Negative)', () => {
    it('POSITIVE: should ignore whitespace changes around quotes', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-const a = '0px';
+const a =  '0px' ;`;
      const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
      expect(result.formatChanges.some(c => c.type === 'whitespace')).toBe(true);
      expect(cleaner.reconstruct(result.cleaned).trim()).toBe('');
    });

    it('NEGATIVE: should NOT ignore changes INSIDE quotes', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-const a = '0px';
+const a = '0 px';`;
      const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
      expect(result.formatChanges.some(c => c.type === 'whitespace')).toBe(false);
      expect(cleaner.reconstruct(result.cleaned)).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,1 +1,1 @@
        -const a = '0px';
        +const a = '0 px';"
      `);
    });

    it('POSITIVE: should ignore leading/trailing whitespace changes', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-  const a = 1;
+const a = 1;  `;
      const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
      expect(result.formatChanges.some(c => c.type === 'whitespace')).toBe(true);
      expect(cleaner.reconstruct(result.cleaned).trim()).toBe('');
    });

    it('POSITIVE: should ignore whitespace changes around arrow functions (=>)', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-this.$nextTick(()=> {
+this.$nextTick(() => {`;
      const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
      expect(result.formatChanges.some(c => c.type === 'whitespace')).toBe(true);
      expect(cleaner.reconstruct(result.cleaned).trim()).toBe('');
    });
  });

  describe('Comment Detector (Positive & Negative)', () => {
    it('POSITIVE: should ignore changes in trailing comments when code is identical', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-const a = 1;//comment
+const a = 1; // updated comment`;
      const result = cleaner.clean(rawDiff, { ignoreCommentChanges: true });
      expect(result.formatChanges.some(c => c.type === 'comment')).toBe(true);
      expect(cleaner.reconstruct(result.cleaned).trim()).toBe('');
    });

    it('NEGATIVE: should NOT ignore if code part changes alongside comment', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-const a = 1; // comment
+const a = 2; // comment`;
      const result = cleaner.clean(rawDiff, { ignoreCommentChanges: true });
      // It might detect a whitespace change if the spacing around // changed,
      // but the overall line should NOT be considered "cleanable" if code changed.
      expect(cleaner.reconstruct(result.cleaned)).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,1 +1,1 @@
        -const a = 1; // comment
        +const a = 2; // comment"
      `);
    });

    it('POSITIVE: should handle block comments', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,1 @@
-const a = 1; /* old */
+const a = 1; /* new */`;
      const result = cleaner.clean(rawDiff, { ignoreCommentChanges: true });
      expect(result.formatChanges.some(c => c.type === 'comment')).toBe(true);
      expect(cleaner.reconstruct(result.cleaned).trim()).toBe('');
    });
  });

  describe('Change Pairing (Block Pairing)', () => {
    it('POSITIVE: should pair multiple removals and additions in a block (b.diff case)', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,5 +1,5 @@
-line1;
-line2;//comment
-line3;
+line1; 
+line2; // updated
+line3; `;
      const result = cleaner.clean(rawDiff, { ignoreWhitespace: true, ignoreCommentChanges: true });
      expect(result.formatChanges.length).toBeGreaterThan(0);
      expect(cleaner.reconstruct(result.cleaned).trim()).toBe('');
    });

    it('NEGATIVE: should only pair up to the minimum of removed/added count', () => {
      const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,3 @@
-const a = 1;
-const b = 2;
+const a = 1; 
+const b = 2; 
+const c = 3;`;
      const result = cleaner.clean(rawDiff, { ignoreWhitespace: true });
      const reconstructed = cleaner.reconstruct(result.cleaned);
      // a and b should be cleaned, but c should remain
      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,2 +1,3 @@
         const a = 1; 
         const b = 2; 
        +const c = 3;"
      `);
    });
  });
});
