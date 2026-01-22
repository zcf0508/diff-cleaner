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
        for (const change of hunkChanges) {
          for (const lineNum of change.lines) {
            linesToFilter.add(lineNum);
          }
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
                && linesToFilter.has(removeLineNumber)
                && linesToFilter.has(addLineNumber)
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

            const lineNumber = line.type === 'add'
              ? line.newLineNumber
              : line.type === 'remove'
                ? line.oldLineNumber
                : undefined;
            if (line.type !== 'context' && lineNumber !== undefined && linesToFilter.has(lineNumber)) {
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
