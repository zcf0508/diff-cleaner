import type { DiffHunk } from '../../types';
import type { ChangePair } from '../utils/change-pair';

import { isSignificantToken, tokenizeForLineWrap } from '../utils/token-utils';

function isWhitespaceOnlyChange(oldStr: string, newStr: string): boolean {
  const oldTokens = tokenizeForLineWrap(oldStr, true);
  const newTokens = tokenizeForLineWrap(newStr, true);

  if (!oldTokens || !newTokens) {
    // Fallback for non-tokenizable content
    const oldNormalized = oldStr.replace(/\s+/g, ' ').trim();
    const newNormalized = newStr.replace(/\s+/g, ' ').trim();
    return oldNormalized === newNormalized && oldNormalized.length > 0;
  }

  // Compare tokens, ignoring differences in whitespace AND comments
  const oldCodeTokens = oldTokens.filter(isSignificantToken);
  const newCodeTokens = newTokens.filter(isSignificantToken);

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

export function detectWhitespaceChanges(hunk: DiffHunk, pairs: ChangePair[]): { oldLines: number[], newLines: number[] } {
  const oldLines = new Set<number>();
  const newLines = new Set<number>();

  for (const pair of pairs) {
    if (isWhitespaceOnlyChange(pair.remove.content, pair.add.content)) {
      if (pair.remove.oldLineNumber !== undefined) { oldLines.add(pair.remove.oldLineNumber); }
      if (pair.add.newLineNumber !== undefined) { newLines.add(pair.add.newLineNumber); }
    }
  }

  for (const line of hunk.lines) {
    if (line.type !== 'context' && line.content.trim() === '') {
      if (line.type === 'remove' && line.oldLineNumber !== undefined) { oldLines.add(line.oldLineNumber); }
      if (line.type === 'add' && line.newLineNumber !== undefined) { newLines.add(line.newLineNumber); }
    }
  }

  return {
    oldLines: [...oldLines],
    newLines: [...newLines],
  };
}
