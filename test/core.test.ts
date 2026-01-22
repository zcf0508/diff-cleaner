import { describe, expect, it } from 'vitest';
import { DiffParser } from '../src/core/parser';
import { DiffReconstructor } from '../src/core/reconstructor';

describe('Core Engine: Parser & Reconstructor', () => {
  const parser = new DiffParser();
  const reconstructor = new DiffReconstructor();

  it('should parse and reconstruct a basic git diff', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
index 1234567..89abcdef 100644
--- a/test.ts
+++ b/test.ts
@@ -1,4 +1,5 @@
  const a = 1;
+const b = 2;
  const c = 3;
 -const d = 4;
  const e = 5;`;

    const parsed = parser.parse(rawDiff);
    expect(parsed.length).toBe(1);
    expect(parsed[0].to).toBe('test.ts');
    expect(parsed[0].hunks.length).toBe(1);
    expect(parsed[0].hunks[0].lines.length).toBe(5);

    const reconstructed = reconstructor.reconstruct(parsed);
    // Use an inline snapshot instead of multiple toContain assertions
    expect(reconstructed).toMatchInlineSnapshot(`
      "diff --git a/test.ts b/test.ts
      index 100644
      --- a/test.ts
      +++ b/test.ts
      @@ -1,4 +1,5 @@
        const a = 1;
      +const b = 2;
        const c = 3;
       -const d = 4;
        const e = 5;"
    `);
  });

  it('should handle file deletion', () => {
    const rawDiff = `diff --git a/old.ts b/old.ts
deleted file mode 100644
index 1234567..0000000
--- a/old.ts
+++ /dev/null
@@ -1,1 +0,0 @@
-content`;

    const parsed = parser.parse(rawDiff);
    expect(parsed[0].type).toBe('delete');
    const reconstructed = reconstructor.reconstruct(parsed);
    expect(reconstructed).toMatchInlineSnapshot(`
      "diff --git a/old.ts b/old.ts
      deleted file mode 100644
      index 1234567..0000000
      --- a/old.ts
      +++ /dev/null
      @@ -1,1 +0,0 @@
      -content"
    `);
  });

  it('should recalculate hunk headers when lines are removed', () => {
    const rawDiff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,5 +1,5 @@
 line1
-line2
+line2-new
 line3
 line4
 line5`;

    const parsed = parser.parse(rawDiff);
    // Simulate manual filtering by removing the +line2-new line
    parsed[0].hunks[0].lines = parsed[0].hunks[0].lines.filter(l => l.content !== 'line2-new');

    const reconstructed = reconstructor.reconstruct(parsed);
    // It goes from -1,5 +1,5 to -1,5 +1,4 after removing one added line
    expect(reconstructed).toMatchInlineSnapshot(`
      "diff --git a/test.ts b/test.ts
      --- a/test.ts
      +++ b/test.ts
      @@ -1,5 +1,4 @@
       line1
      -line2
       line3
       line4
       line5"
    `);
  });
});
