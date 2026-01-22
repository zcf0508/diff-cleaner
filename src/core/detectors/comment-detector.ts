import type { DiffHunk } from '../../types';
import type { ChangePair } from '../utils/change-pair';
import { addLineNumber } from '../utils/change-pair';
import { isCommentLine } from '../utils/file-type-utils';

function isCommentOnlyChange(oldStr: string, newStr: string): boolean {
  const oldTrim = oldStr.trim();
  const newTrim = newStr.trim();

  return (
    isCommentLine(oldTrim)
    && isCommentLine(newTrim)
    && oldTrim !== newTrim
  );
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
