import type { DiffHunk } from '../../types';
import type { ChangePair } from '../utils/change-pair';
import { addLineNumber } from '../utils/change-pair';

function hasQuote(content: string): boolean {
  return /['"`]/.test(content);
}

function isWhitespaceOnlyChange(oldStr: string, newStr: string): boolean {
  if (hasQuote(oldStr) || hasQuote(newStr)) {
    return false;
  }
  const oldNormalized = oldStr.replace(/\s+/g, ' ').trim();
  const newNormalized = newStr.replace(/\s+/g, ' ').trim();
  return oldNormalized === newNormalized && oldNormalized.length > 0;
}

export function detectWhitespaceChanges(hunk: DiffHunk, pairs: ChangePair[]): number[] {
  const affectedLines = new Set<number>();

  for (const pair of pairs) {
    if (isWhitespaceOnlyChange(pair.remove.content, pair.add.content)) {
      addLineNumber(affectedLines, pair.remove);
      addLineNumber(affectedLines, pair.add);
    }
  }

  for (const line of hunk.lines) {
    if (line.type !== 'context' && line.content.trim() === '') {
      addLineNumber(affectedLines, line);
    }
  }

  return [...affectedLines];
}
