import type { DiffHunk, DiffLine } from '../../types';
import { addLineNumber } from '../utils/change-pair';
import { isImportLine, isImportSupportedFile } from '../utils/file-type-utils';
import { buildMultiset, isMultisetEqual } from '../utils/token-utils';

export function detectImportReordering(hunk: DiffHunk, filePath?: string): number[] {
  if (!filePath || !isImportSupportedFile(filePath)) {
    return [];
  }

  const affectedLines = new Set<number>();
  let blockLines: DiffLine[] = [];

  const flushBlock = (): void => {
    if (blockLines.length === 0) { return; }
    const removed = blockLines.filter(l => l.type === 'remove');
    const added = blockLines.filter(l => l.type === 'add');
    if (removed.length === 0 || added.length === 0) {
      blockLines = [];
      return;
    }

    const allImport = blockLines.every(line => isImportLine(line.content, filePath));
    if (!allImport) {
      blockLines = [];
      return;
    }

    const removedSet = buildMultiset(removed.map(l => l.content.trim()));
    const addedSet = buildMultiset(added.map(l => l.content.trim()));
    if (isMultisetEqual(removedSet, addedSet)) {
      for (const line of blockLines) {
        addLineNumber(affectedLines, line);
      }
    }
    blockLines = [];
  };

  for (const line of hunk.lines) {
    if (line.type !== 'context') {
      blockLines.push(line);
    }
    else {
      flushBlock();
    }
  }
  flushBlock();

  return [...affectedLines];
}
