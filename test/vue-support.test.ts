import { describe, expect, it } from 'vitest';
import { DiffCleaner } from '../src/index';

describe('DiffCleaner: Vue Support', () => {
  const cleaner = new DiffCleaner();

  it('should clean import reordering in Vue files', () => {
    const rawDiff = `diff --git a/src/App.vue b/src/App.vue
--- a/src/App.vue
+++ b/src/App.vue
@@ -1,6 +1,6 @@
 <script>
-import navbar from '@/views/navbar/index.vue';
-import ImgPreview from '@/components/img-preview.vue';
+import ImgPreview from '@/components/img-preview.vue';
+import navbar from '@/views/navbar/index.vue';
 import buildUrl from '@googlicius/build-url';
 </script>`;

    const result = cleaner.clean(rawDiff, { ignoreImportReordering: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    expect(result.formatChanges.some(c => c.type === 'import')).toBe(true);
    expect(reconstructed.trim()).toBe('');
  });

  it('should clean line-wrapping changes in Vue files', () => {
    const rawDiff = `diff --git a/src/App.vue b/src/App.vue
--- a/src/App.vue
+++ b/src/App.vue
@@ -1,3 +1,5 @@
 <script>
-const data = { a: 1, b: 2 };
+const data = {
+  a: 1, b: 2
+};
 </script>`;

    const result = cleaner.clean(rawDiff, { ignoreLineWrappingChanges: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);

    expect(result.formatChanges.some(c => c.type === 'line-wrap')).toBe(true);
    expect(reconstructed.trim()).toBe('');
  });
});
