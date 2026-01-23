import type { DiffHunk } from '../../types';
import type { ChangePair } from '../utils/change-pair';
import { addLineNumber } from '../utils/change-pair';
import { isCommentLine } from '../utils/file-type-utils';

import { tokenizeForLineWrap } from '../utils/token-utils';

function isCommentToken(token: string): boolean {
  return token.startsWith('//') || (token.startsWith('/*') && token.endsWith('*/'));
}

function isCommentOnlyChange(oldStr: string, newStr: string): boolean {
  const oldTokens = tokenizeForLineWrap(oldStr, true);
  const newTokens = tokenizeForLineWrap(newStr, true);

  if (!oldTokens || !newTokens) {
    const oldTrim = oldStr.trim();
    const newTrim = newStr.trim();
    return isCommentLine(oldTrim) && isCommentLine(newTrim) && oldTrim !== newTrim;
  }

  // Filter out comment tokens AND whitespace tokens for code comparison
  const oldCodeTokens = oldTokens.filter(t => !isCommentToken(t) && !/^\s+$/.test(t));
  const newCodeTokens = newTokens.filter(t => !isCommentToken(t) && !/^\s+$/.test(t));

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

export function detectCommentChanges(hunk: DiffHunk, pairs: ChangePair[]): number[] {
  const affectedLines = new Set<number>();

  for (const pair of pairs) {
    if (isCommentOnlyChange(pair.remove.content, pair.add.content)) {
      addLineNumber(affectedLines, pair.remove);
      addLineNumber(affectedLines, pair.add);
    }
  }

  for (const line of hunk.lines) {
    if (line.type !== 'context' && isCommentLine(line.content)) {
      addLineNumber(affectedLines, line);
    }
  }

  return [...affectedLines];
}
