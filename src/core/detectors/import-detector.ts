import type { DiffHunk, DiffLine } from '../../types';
import type { ChangePair } from '../utils/change-pair';
import { isImportLine, isImportSupportedFile } from '../utils/file-type-utils';

export function detectImportReordering(hunk: DiffHunk, filePath?: string): { oldLines: number[], newLines: number[], pairs: ChangePair[] } {
  if (!filePath || !isImportSupportedFile(filePath)) {
    return { oldLines: [], newLines: [], pairs: [] };
  }

  const removedImports: { line: DiffLine, index: number, content: string }[] = [];
  const addedImports: { line: DiffLine, index: number, content: string }[] = [];

  // 1. Collect all removed and added import lines in the hunk
  hunk.lines.forEach((line, index) => {
    if (line.type === 'remove' && isImportLine(line.content, filePath)) {
      removedImports.push({ line, index, content: line.content.trim() });
    }
    else if (line.type === 'add' && isImportLine(line.content, filePath)) {
      addedImports.push({ line, index, content: line.content.trim() });
    }
  });

  if (removedImports.length === 0 || addedImports.length === 0) {
    return { oldLines: [], newLines: [], pairs: [] };
  }

  const oldLines = new Set<number>();
  const newLines = new Set<number>();
  const pairs: ChangePair[] = [];

  // 2. Match removed imports with added imports
  const usedAddedIndices = new Set<number>();

  for (const removed of removedImports) {
    const matchIndex = addedImports.findIndex((added, index) =>
      !usedAddedIndices.has(index) && added.content === removed.content,
    );

    if (matchIndex !== -1) {
      const matchedAdded = addedImports[matchIndex];
      usedAddedIndices.add(matchIndex);

      if (removed.line.oldLineNumber !== undefined) {
        oldLines.add(removed.line.oldLineNumber);
      }
      if (matchedAdded.line.newLineNumber !== undefined) {
        newLines.add(matchedAdded.line.newLineNumber);
      }

      pairs.push({
        remove: removed.line,
        add: matchedAdded.line,
        removeIndex: removed.index,
        addIndex: matchedAdded.index,
      });
    }
  }

  return {
    oldLines: [...oldLines],
    newLines: [...newLines],
    pairs,
  };
}
