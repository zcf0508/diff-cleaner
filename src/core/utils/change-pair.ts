import type { DiffLine } from '../../types';

export interface ChangePair {
  remove: DiffLine
  add: DiffLine
  removeIndex: number
  addIndex: number
}

export function findChangePairs(lines: DiffLine[]): ChangePair[] {
  const pairs: ChangePair[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i];
    const next = lines[i + 1];
    if (current.type === 'remove' && next.type === 'add') {
      pairs.push({
        remove: current,
        add: next,
        removeIndex: i,
        addIndex: i + 1,
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
