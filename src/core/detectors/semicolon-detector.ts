import type { DiffHunk, DiffLine } from '../../types';
import type { ChangePair } from '../utils/change-pair';

function isSemicolonOnlyChange(oldStr: string, newStr: string, nextLine?: DiffLine): boolean {
  const oldTrim = oldStr.trim();
  const newTrim = newStr.trim();
  const oldWithoutSemi = oldTrim.endsWith(';')
    ? oldTrim.slice(0, -1)
    : oldTrim;
  const newWithoutSemi = newTrim.endsWith(';')
    ? newTrim.slice(0, -1)
    : newTrim;
  if (oldWithoutSemi !== newWithoutSemi || oldTrim === newTrim) {
    return false;
  }

  if (nextLine) {
    const nextTrim = nextLine.content.trim();
    if (/^[[(+/\-`]/.test(nextTrim)) {
      return false;
    }
  }

  return true;
}

export function detectSemicolonChanges(hunk: DiffHunk, pairs: ChangePair[]): { oldLines: number[], newLines: number[] } {
  const oldLines = new Set<number>();
  const newLines = new Set<number>();

  for (const pair of pairs) {
    if (isSemicolonOnlyChange(pair.remove.content, pair.add.content, hunk.lines[pair.addIndex + 1])) {
      if (pair.remove.oldLineNumber !== undefined) { oldLines.add(pair.remove.oldLineNumber); }
      if (pair.add.newLineNumber !== undefined) { newLines.add(pair.add.newLineNumber); }
    }
  }

  return {
    oldLines: [...oldLines],
    newLines: [...newLines],
  };
}
