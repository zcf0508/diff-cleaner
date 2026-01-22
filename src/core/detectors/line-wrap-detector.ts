import type { DiffHunk, DiffLine } from '../../types';
import { addLineNumber } from '../utils/change-pair';
import { isLineWrapSupportedFile } from '../utils/file-type-utils';
import { isTokenSequenceEqual, normalizeLineWrapTokens, tokenizeForLineWrap } from '../utils/token-utils';

export function detectLineWrapChanges(hunk: DiffHunk, filePath?: string): number[] {
  if (!filePath || !isLineWrapSupportedFile(filePath)) {
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

    const removedText = removed.map(l => l.content).join('\n');
    const addedText = added.map(l => l.content).join('\n');
    if (removedText === addedText) {
      blockLines = [];
      return;
    }

    const removedTokens = normalizeLineWrapTokens(tokenizeForLineWrap(removedText));
    const addedTokens = normalizeLineWrapTokens(tokenizeForLineWrap(addedText));
    if (!removedTokens || !addedTokens) {
      blockLines = [];
      return;
    }

    if (isTokenSequenceEqual(removedTokens, addedTokens)) {
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
