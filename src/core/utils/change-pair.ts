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

    while (i < lines.length && lines[i].type !== 'context') {
      if (lines[i].type === 'remove') {
        removed.push({ line: lines[i], index: i });
      }
      else if (lines[i].type === 'add') {
        added.push({ line: lines[i], index: i });
      }
      i++;
    }

    // Pair by order in the block
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
