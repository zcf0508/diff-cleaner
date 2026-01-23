import type { CleanDiffConfig, DiffFile, DiffLine, FormattingChange } from '../types';
import { FormatDetector } from './detector';

export class DiffFilter {
  private detector = new FormatDetector();

  filter(files: DiffFile[], config: CleanDiffConfig): { cleaned: DiffFile[], changes: FormattingChange[], filesWithChanges: string[] } {
    const allChanges: FormattingChange[] = [];
    const cleanedFiles: DiffFile[] = [];
    const filesWithChanges = new Set<string>();

    for (const file of files) {
      const cleanedHunks = [];
      let fileHasChanges = false;
      for (const hunk of file.hunks) {
        const hunkChanges = this.detector.detect(hunk, config, file.path);
        allChanges.push(...hunkChanges);

        const linesToFilter = new Set<number>();
        const lineWrapLines = new Set<number>();
        for (const change of hunkChanges) {
          if (change.type === 'line-wrap') {
            for (const lineNum of change.lines) {
              lineWrapLines.add(lineNum);
            }
          }
          for (const lineNum of change.lines) {
            linesToFilter.add(lineNum);
          }
        }

        const nonLineWrapLinesToFilter = new Set<number>();
        for (const lineNum of linesToFilter) {
          if (!lineWrapLines.has(lineNum)) {
            nonLineWrapLinesToFilter.add(lineNum);
          }
        }

        const oldLinesToFilter = new Set<number>();
        const newLinesToFilter = new Set<number>();
        const lineWrapLineIndexes = new Set<number>();

        for (const line of hunk.lines) {
          if (line.type === 'remove' && line.oldLineNumber !== undefined && nonLineWrapLinesToFilter.has(line.oldLineNumber)) {
            oldLinesToFilter.add(line.oldLineNumber);
          }
          if (line.type === 'add' && line.newLineNumber !== undefined && nonLineWrapLinesToFilter.has(line.newLineNumber)) {
            newLinesToFilter.add(line.newLineNumber);
          }
        }

        if (lineWrapLines.size > 0) {
          let blockIndices: number[] = [];
          let blockLines: DiffLine[] = [];

          const flushBlock = (): void => {
            if (blockLines.length === 0) { return; }
            const isLineWrapBlock = blockLines.every((blockLine) => {
              if (blockLine.type === 'add') {
                return blockLine.newLineNumber !== undefined && lineWrapLines.has(blockLine.newLineNumber);
              }
              if (blockLine.type === 'remove') {
                return blockLine.oldLineNumber !== undefined && lineWrapLines.has(blockLine.oldLineNumber);
              }
              return false;
            });

            if (isLineWrapBlock) {
              for (const index of blockIndices) {
                lineWrapLineIndexes.add(index);
              }
            }

            blockIndices = [];
            blockLines = [];
          };

          for (let i = 0; i < hunk.lines.length; i++) {
            const line = hunk.lines[i];
            if (line.type !== 'context') {
              blockIndices.push(i);
              blockLines.push(line);
            }
            else {
              flushBlock();
            }
          }
          flushBlock();
        }

        if (linesToFilter.size > 0) {
          const newLines: DiffLine[] = [];
          for (let i = 0; i < hunk.lines.length; i++) {
            const line = hunk.lines[i];
            if (line.type === 'remove') {
              const nextLine = hunk.lines[i + 1];
              const removeLineNumber = line.oldLineNumber;
              const addLineNumber = nextLine?.newLineNumber;
              if (
                nextLine
                && nextLine.type === 'add'
                && removeLineNumber !== undefined
                && addLineNumber !== undefined
                && oldLinesToFilter.has(removeLineNumber)
                && newLinesToFilter.has(addLineNumber)
                && !(lineWrapLineIndexes.has(i) && lineWrapLineIndexes.has(i + 1))
              ) {
                fileHasChanges = true;
                newLines.push({
                  type: 'context',
                  content: nextLine.content,
                  oldLineNumber: line.oldLineNumber,
                  newLineNumber: nextLine.newLineNumber,
                });
                i++;
                continue;
              }
            }

            if (lineWrapLineIndexes.has(i)) {
              fileHasChanges = true;
              continue;
            }

            if (line.type === 'remove' && line.oldLineNumber !== undefined && oldLinesToFilter.has(line.oldLineNumber)) {
              fileHasChanges = true;
              continue;
            }
            if (line.type === 'add' && line.newLineNumber !== undefined && newLinesToFilter.has(line.newLineNumber)) {
              fileHasChanges = true;
              continue;
            }

            newLines.push(line);
          }

          if (newLines.some(l => l.type !== 'context')) {
            cleanedHunks.push({ ...hunk, lines: newLines });
          }
        }
        else {
          cleanedHunks.push(hunk);
        }
      }

      if (cleanedHunks.length > 0) {
        cleanedFiles.push({ ...file, hunks: cleanedHunks });
      }
      if (fileHasChanges) {
        filesWithChanges.add(file.path);
      }
    }

    return { cleaned: cleanedFiles, changes: allChanges, filesWithChanges: [...filesWithChanges] };
  }
}
