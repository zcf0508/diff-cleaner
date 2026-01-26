import type { DiffHunk } from '../../types';
import type { ChangePair } from '../utils/change-pair';
import { isCommentLine } from '../utils/file-type-utils';

import { isSignificantToken, tokenizeForLineWrap } from '../utils/token-utils';

function isCommentOnlyChange(oldStr: string, newStr: string): boolean {
  const oldTokens = tokenizeForLineWrap(oldStr, true);
  const newTokens = tokenizeForLineWrap(newStr, true);

  if (!oldTokens || !newTokens) {
    const oldTrim = oldStr.trim();
    const newTrim = newStr.trim();
    return isCommentLine(oldTrim) && isCommentLine(newTrim) && oldTrim !== newTrim;
  }

  // Filter out non-significant tokens (comments and whitespace) for code comparison
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

  // If code tokens are identical, check if there was any change at all (which must be in comments or whitespace)
  return oldStr !== newStr;
}

export function detectCommentChanges(hunk: DiffHunk, pairs: ChangePair[]): { oldLines: number[], newLines: number[] } {
  const oldLines = new Set<number>();
  const newLines = new Set<number>();

  for (const pair of pairs) {
    if (isCommentOnlyChange(pair.remove.content, pair.add.content)) {
      if (pair.remove.oldLineNumber !== undefined) { oldLines.add(pair.remove.oldLineNumber); }
      if (pair.add.newLineNumber !== undefined) { newLines.add(pair.add.newLineNumber); }
    }
  }

  for (const line of hunk.lines) {
    if (line.type !== 'context' && isCommentLine(line.content)) {
      if (line.type === 'remove' && line.oldLineNumber !== undefined) { oldLines.add(line.oldLineNumber); }
      if (line.type === 'add' && line.newLineNumber !== undefined) { newLines.add(line.newLineNumber); }
    }
  }

  return {
    oldLines: [...oldLines],
    newLines: [...newLines],
  };
}
