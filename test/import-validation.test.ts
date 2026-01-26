import { describe, expect, it } from 'vitest';
import { DiffCleaner } from '../src/index';

describe('Import Reordering Validation', () => {
  const cleaner = new DiffCleaner();
  const config = {
    ignoreImportReordering: true,
  };

  describe('Positive Cases (Should be filtered/converted to context)', () => {
    it('should handle simple contiguous import reordering', () => {
      const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,2 @@
-import { B } from './b';
-import { A } from './a';
+import { A } from './a';
+import { B } from './b';`;

      const result = cleaner.clean(diff, config);
      const reconstructed = cleaner.reconstruct(result.cleaned);

      // Should convert to context lines
      expect(reconstructed).toMatchInlineSnapshot('""');
    });

    it('should handle non-contiguous import reordering (like in c.diff)', () => {
      const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,5 +1,5 @@
-import { A } from './a';
+import { B } from './b';
 import { C } from './c';
-import { B } from './b';
+import { A } from './a';
 import { D } from './d';`;

      const result = cleaner.clean(diff, config);
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(reconstructed).toMatchInlineSnapshot('""');
    });
  });

  describe('Negative Cases (Should be retained as changes)', () => {
    it('should NOT filter when import content changes', () => {
      const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,2 @@
-import { A } from './a';
-import { B } from './b';
+import { A, A2 } from './a';
+import { B } from './b';`;

      const result = cleaner.clean(diff, config);
      const reconstructed = cleaner.reconstruct(result.cleaned);

      // Content changed (A -> A, A2), should remain a diff
      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,2 +1,2 @@
        -import { A } from './a';
        +import { A, A2 } from './a';
         import { B } from './b';"
      `);
    });

    it('should NOT filter when an import is added but not removed elsewhere', () => {
      const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,1 +1,2 @@
 import { A } from './a';
+import { B } from './b';`;

      const result = cleaner.clean(diff, config);
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,1 +1,2 @@
         import { A } from './a';
        +import { B } from './b';"
      `);
    });

    it('should NOT filter when an import is removed but not added elsewhere', () => {
      const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,2 +1,1 @@
 import { A } from './a';
-import { B } from './b';`;

      const result = cleaner.clean(diff, config);
      const reconstructed = cleaner.reconstruct(result.cleaned);

      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,2 +1,1 @@
         import { A } from './a';
        -import { B } from './b';"
      `);
    });

    it('should handle partial reordering and partial logic change mixed', () => {
      const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
-import { A } from './a';
-import { B } from './b';
-import { C } from './c';
+import { B } from './b';
+import { A } from './a';
+import { D } from './d';`;

      const result = cleaner.clean(diff, config);
      const reconstructed = cleaner.reconstruct(result.cleaned);

      // A and B are reordered -> should become context
      // C is removed, D is added -> should remain as diff
      expect(reconstructed).toMatchInlineSnapshot(`
        "diff --git a/test.ts b/test.ts
        --- a/test.ts
        +++ b/test.ts
        @@ -1,3 +1,3 @@
        -import { C } from './c';
         import { B } from './b';
         import { A } from './a';
        +import { D } from './d';"
      `);
    });
  });
});
