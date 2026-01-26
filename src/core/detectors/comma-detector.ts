import type { ChangePair } from '../utils/change-pair';

function isTrailingCommaOnlyChange(oldStr: string, newStr: string): boolean {
  const oldTrim = oldStr.trim();
  const newTrim = newStr.trim();

  // If this looks like JSON, a trailing comma change is a syntax error, not formatting
  // This detection is intentionally conservative and can be refined by file extension later
  const isJsonContext
    = oldTrim.startsWith('"')
      || newTrim.startsWith('"')
      || oldTrim.includes('":');

  if (isJsonContext) {
    return false;
  }

  const oldWithoutComma = oldTrim.endsWith(',')
    ? oldTrim.slice(0, -1)
    : oldTrim;
  const newWithoutComma = newTrim.endsWith(',')
    ? newTrim.slice(0, -1)
    : newTrim;

  return oldWithoutComma === newWithoutComma && oldTrim !== newTrim;
}

export function detectTrailingCommaChanges(pairs: ChangePair[]): { oldLines: number[], newLines: number[] } {
  const oldLines = new Set<number>();
  const newLines = new Set<number>();

  for (const pair of pairs) {
    if (isTrailingCommaOnlyChange(pair.remove.content, pair.add.content)) {
      if (pair.remove.oldLineNumber !== undefined) { oldLines.add(pair.remove.oldLineNumber); }
      if (pair.add.newLineNumber !== undefined) { newLines.add(pair.add.newLineNumber); }
    }
  }

  return {
    oldLines: [...oldLines],
    newLines: [...newLines],
  };
}
