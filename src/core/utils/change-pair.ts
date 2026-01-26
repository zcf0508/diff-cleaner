import type { DiffLine } from '../../types';

export interface ChangePair {
  remove: DiffLine
  add: DiffLine
  removeIndex: number
  addIndex: number
}

export function findChangePairs(lines: DiffLine[]): ChangePair[] {
  const pairs: ChangePair[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === 'context') {
      i++;
      continue;
    }

    const removed: { line: DiffLine, index: number }[] = [];
    const added: { line: DiffLine, index: number }[] = [];

    // Collect all consecutive non-context lines
    while (i < lines.length && lines[i].type !== 'context') {
      if (lines[i].type === 'remove') {
        removed.push({ line: lines[i], index: i });
      }
      else if (lines[i].type === 'add') {
        added.push({ line: lines[i], index: i });
      }
      i++;
    }

    // Improved pairing logic: match by content similarity if counts don't match?
    // For now, let's look at why a.diff's block failed.
    // a.diff's block:
    // - next
    // - nextStep
    // - iknow
    // - immedialyExp
    // - curTop
    // + next
    // + nextStep
    // + iknow
    // + immedialyExp
    // + curTop
    // These are 5 removals followed by 5 additions. Math.min(5, 5) = 5.
    // They SHOULD be paired 1-to-1 in order.

    const count = Math.min(removed.length, added.length);
    for (let j = 0; j < count; j++) {
      pairs.push({
        remove: removed[j].line,
        add: added[j].line,
        removeIndex: removed[j].index,
        addIndex: added[j].index,
      });
    }
  }
  return pairs;
}

export function addLineNumber(target: Set<number>, line: DiffLine): void {
  const lineNumber = line.type === 'add'
    ? line.newLineNumber
    : line.oldLineNumber;
  if (lineNumber !== undefined) {
    target.add(lineNumber);
  }
}
