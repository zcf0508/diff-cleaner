import { describe, expect, it } from 'vitest';
import { DiffCleaner } from '../src/index';

describe('DiffCleaner: Issue Reproduction', () => {
  const cleaner = new DiffCleaner();

  it('should correctly identify and clean whitespace+comment changes and preserve content as context', () => {
    const rawDiff = `diff --git a/src/App.vue b/src/App.vue
index 100755
--- a/src/App.vue
+++ b/src/App.vue
@@ -31,7 +31,6 @@
   data() {
     return {
       isShowGuide: true,
-      iknow: false,//【管理伙伴】的知道了
       next: false, // 分组和管理的引导
       nextStep: false, // 【添加分组】的下一步
       immedialyExp: true, // 立即体验`;
    const result = cleaner.clean(rawDiff, { ignoreWhitespace: true, ignoreCommentChanges: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);
    expect(reconstructed).toContain('-      iknow: false,//【管理伙伴】的知道了');
  });

  it('should handle formatting changes in a mixed block correctly', () => {
    const rawDiff = `diff --git a/src/App.vue b/src/App.vue
index 100755
--- a/src/App.vue
+++ b/src/App.vue
@@ -34,7 +34,8 @@
   data() {
     return {
       isShowGuide: true,
-      iknow: false,//【管理伙伴】的知道了
+      iknow: false, // 【管理伙伴】的知道了
       next: false, // 分组和管理的引导
-      nextStep: false, // 【添加分组】的下一步
+      nextStep: true, // 这是个真实变更
       immedialyExp: true, // 立即体验`;
    const result = cleaner.clean(rawDiff, { ignoreWhitespace: true, ignoreCommentChanges: true });
    const reconstructed = cleaner.reconstruct(result.cleaned);
    expect(reconstructed).toMatchInlineSnapshot(`
      "diff --git a/src/App.vue b/src/App.vue
      index 100755
      --- a/src/App.vue
      +++ b/src/App.vue
      @@ -34,7 +34,7 @@
         data() {
           return {
             isShowGuide: true,
             iknow: false, // 【管理伙伴】的知道了
             next: false, // 分组和管理的引导
      -      nextStep: false, // 【添加分组】的下一步
      +      nextStep: true, // 这是个真实变更
             immedialyExp: true, // 立即体验"
    `);
  });
});
