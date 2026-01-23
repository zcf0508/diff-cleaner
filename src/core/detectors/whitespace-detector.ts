import type { DiffHunk } from '../../types';
import type { ChangePair } from '../utils/change-pair';
import { addLineNumber } from '../utils/change-pair';

import { tokenizeForLineWrap } from '../utils/token-utils';

function isWhitespaceOnlyChange(oldStr: string, newStr: string): boolean {
  const oldTokens = tokenizeForLineWrap(oldStr, true);
  const newTokens = tokenizeForLineWrap(newStr, true);

  if (!oldTokens || !newTokens) {
    // Fallback for non-tokenizable content
    const oldNormalized = oldStr.replace(/\s+/g, ' ').trim();
    const newNormalized = newStr.replace(/\s+/g, ' ').trim();
    return oldNormalized === newNormalized && oldNormalized.length > 0;
  }

  // Compare tokens, ignoring differences in whitespace tokens
  const oldCodeTokens = oldTokens.filter(t => !/^\s+$/.test(t));
  const newCodeTokens = newTokens.filter(t => !/^\s+$/.test(t));

  if (oldCodeTokens.length !== newCodeTokens.length) {
    return false;
  }

  for (let i = 0; i < oldCodeTokens.length; i++) {
    if (oldCodeTokens[i] !== newCodeTokens[i]) {
      return false;
    }
  }

  return oldStr !== newStr;
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
