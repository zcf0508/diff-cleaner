import type { DiffFile, DiffHunk } from '../types';

export class DiffReconstructor {
  /**
   * Reconstruct unified diff text from parsed AST
   * Core logic: automatically recalculate hunk header ranges
   */
  reconstruct(files: DiffFile[]): string {
    const output: string[] = [];

    for (const file of files) {
      const fileHunks: string[] = [];

      for (const hunk of file.hunks) {
        // Only keep lines that are NOT contextual or represent a real change
        const hasChange = hunk.lines.some(l => l.type !== 'context');

        const hunkContent = this.generateHunkContent(hunk);
        if (hunkContent.length === 0) { continue; }

        // Recalculate hunk header
        const recalculatedHeader = this.recalculateHunkHeader(hunk);

        if (!hasChange) {
          // If no change, we still keep the file header but this hunk is essentially context now.
          // In standard diff, we might skip the hunk entirely.
          // But our goal is to show clean diff, so we skip it.
          continue;
        }

        fileHunks.push(recalculatedHeader);
        fileHunks.push(...hunkContent);
      }

      if (fileHunks.length > 0) {
        output.push(this.generateFileHeader(file));
        output.push(...fileHunks);
      }
    }

    const result = output.join('\n');
    return result;
  }

  private generateHunkContent(hunk: DiffHunk): string[] {
    return hunk.lines.map((line) => {
      const prefix = line.type === 'add'
        ? '+'
        : line.type === 'remove'
          ? '-'
          : ' ';
      return `${prefix}${line.content}`;
    });
  }

  private generateFileHeader(file: DiffFile): string {
    const lines: string[] = [];
    lines.push(`diff --git a/${file.from || file.to} b/${file.to || file.from}`);

    if (file.type === 'add' && file.metadata?.newMode) {
      lines.push(`new file mode ${file.metadata.newMode}`);
    }
    else if (file.type === 'delete' && file.metadata?.oldMode) {
      lines.push(`deleted file mode ${file.metadata.oldMode}`);
    }
    else if (file.type === 'rename') {
      lines.push(`rename from ${file.from}`);
      lines.push(`rename to ${file.to}`);
      if (file.metadata?.similarity) {
        lines.push(`similarity index ${file.metadata.similarity}%`);
      }
    }

    if (file.metadata?.index) {
      lines.push(`index ${file.metadata.index.join('..')}${file.metadata.newMode
        ? ` ${file.metadata.newMode}`
        : ''}`);
    }

    lines.push(`--- ${file.type === 'add'
      ? '/dev/null'
      : `a/${file.from || file.to}`}`);
    lines.push(`+++ ${file.type === 'delete'
      ? '/dev/null'
      : `b/${file.to || file.from}`}`);

    return lines.join('\n');
  }

  private recalculateHunkHeader(hunk: DiffHunk): string {
    let oldLines = 0;
    let newLines = 0;

    for (const line of hunk.lines) {
      if (line.type === 'context') {
        oldLines++;
        newLines++;
      }
      else if (line.type === 'remove') {
        oldLines++;
      }
      else if (line.type === 'add') {
        newLines++;
      }
    }

    return `@@ -${hunk.oldStart},${oldLines} +${hunk.newStart},${newLines} @@`;
  }
}
