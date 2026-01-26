import type { CleanDiffConfig, DiffFile, DiffLine, FormattingChange } from '../types';
import { FormatDetector } from './detector';

export class DiffFilter {
  private detector = new FormatDetector();
  private lineWrapContextMap = new Map<number, { originalIndices: number[], contextLines: DiffLine[] }>();

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

        const oldLinesToFilter = new Set<number>();
        const newLinesToFilter = new Set<number>();
        const lineWrapLines = new Set<number>();
        const lineWrapLineIndexes = new Set<number>();

        for (const change of hunkChanges) {
          if (change.type === 'line-wrap') {
            if (change.oldLines) {
              for (const lineNum of change.oldLines) {
                lineWrapLines.add(lineNum);
              }
            }
            if (change.newLines) {
              for (const lineNum of change.newLines) {
                lineWrapLines.add(lineNum);
              }
            }
          }
          if (change.oldLines) {
            for (const lineNum of change.oldLines) {
              oldLinesToFilter.add(lineNum);
            }
          }
          if (change.newLines) {
            for (const lineNum of change.newLines) {
              newLinesToFilter.add(lineNum);
            }
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
              // Convert line-wrap block to context
              const removedLines = blockLines.filter(l => l.type === 'remove');
              const addedLines = blockLines.filter(l => l.type === 'add');

              // If it's a line-wrap change, we prefer the added version's content
              // but we need to decide how to represent it as context.
              // For simplicity and correctness, we'll use the added lines as context.
              for (let j = 0; j < addedLines.length; j++) {
                const addLine = addedLines[j];
                const correspondingRemove = removedLines[j] || removedLines[removedLines.length - 1];

                const contextLine: DiffLine = {
                  type: 'context',
                  content: addLine.content,
                  oldLineNumber: correspondingRemove?.oldLineNumber,
                  newLineNumber: addLine.newLineNumber,
                };
                // We mark these indices to be replaced later
                for (const index of blockIndices) {
                  lineWrapLineIndexes.add(index);
                }
                // Store the generated context lines to be inserted
                this.lineWrapContextMap.set(blockIndices[0], {
                  originalIndices: [...blockIndices],
                  contextLines: addedLines.map((al, idx) => ({
                    type: 'context',
                    content: al.content,
                    oldLineNumber: removedLines[idx]?.oldLineNumber,
                    newLineNumber: al.newLineNumber,
                  })),
                });
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

        if (oldLinesToFilter.size > 0 || newLinesToFilter.size > 0 || lineWrapLines.size > 0) {
          const newLines: DiffLine[] = [];
          const pairs = this.detector.getPairsForHunk(hunk);
          const pairMap = new Map<number, number>(); // removeLineNum -> addLineNum
          const reversePairMap = new Map<number, number>(); // addLineNum -> removeLineNum

          for (const pair of pairs) {
            if (pair.remove.oldLineNumber !== undefined && pair.add.newLineNumber !== undefined) {
              pairMap.set(pair.remove.oldLineNumber, pair.add.newLineNumber);
              reversePairMap.set(pair.add.newLineNumber, pair.remove.oldLineNumber);
            }
          }

          for (let i = 0; i < hunk.lines.length; i++) {
            const line = hunk.lines[i];

            if (this.lineWrapContextMap.has(i)) {
              const info = this.lineWrapContextMap.get(i)!;
              newLines.push(...info.contextLines);
              fileHasChanges = true;
              // Skip the rest of the original indices in this block
              i = info.originalIndices[info.originalIndices.length - 1];
              continue;
            }

            if (lineWrapLineIndexes.has(i)) {
              // This line was part of a line-wrap block but not the start index we handled above
              continue;
            }

            if (line.type === 'remove' && line.oldLineNumber !== undefined && oldLinesToFilter.has(line.oldLineNumber)) {
              const matchedAddLineNum = pairMap.get(line.oldLineNumber);
              if (matchedAddLineNum !== undefined && newLinesToFilter.has(matchedAddLineNum)) {
                // This remove line has a corresponding add line that is also filtered.
                // We'll convert the ADD line to context when we encounter it, and skip this remove line.
                fileHasChanges = true;
                continue;
              }
              // Standalone remove (like a blank line removal that we want to ignore)
              fileHasChanges = true;
              continue;
            }

            if (line.type === 'add' && line.newLineNumber !== undefined && newLinesToFilter.has(line.newLineNumber)) {
              const matchedRemoveLineNum = reversePairMap.get(line.newLineNumber);
              if (matchedRemoveLineNum !== undefined && oldLinesToFilter.has(matchedRemoveLineNum)) {
                // Convert to context using the ADD line's content
                fileHasChanges = true;
                newLines.push({
                  type: 'context',
                  content: line.content,
                  oldLineNumber: matchedRemoveLineNum,
                  newLineNumber: line.newLineNumber,
                });
                continue;
              }
              // Standalone add (like a blank line addition that we want to ignore)
              fileHasChanges = true;
              continue;
            }

            newLines.push(line);
          }

          if (newLines.length > 0) {
            cleanedHunks.push({ ...hunk, lines: newLines });
          }
        }
        else {
          cleanedHunks.push(hunk);
        }
        this.lineWrapContextMap.clear();
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
