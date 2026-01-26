import type { ChangePair } from '../utils/change-pair';

function isQuoteOnlyChange(oldStr: string, newStr: string): boolean {
  const hasInterpolation = (s: string): boolean => /\${.*}/.test(s);
  if (hasInterpolation(oldStr) || hasInterpolation(newStr)) {
    return false;
  }

  const normalizeQuotes = (s: string): string => s.replace(/['"`]/g, '"');
  const normalizedOld = normalizeQuotes(oldStr);
  const normalizedNew = normalizeQuotes(newStr);

  return normalizedOld === normalizedNew && oldStr !== newStr;
}

export function detectQuoteChanges(pairs: ChangePair[]): { oldLines: number[], newLines: number[] } {
  const oldLines = new Set<number>();
  const newLines = new Set<number>();

  for (const pair of pairs) {
    if (isQuoteOnlyChange(pair.remove.content, pair.add.content)) {
      if (pair.remove.oldLineNumber !== undefined) { oldLines.add(pair.remove.oldLineNumber); }
      if (pair.add.newLineNumber !== undefined) { newLines.add(pair.add.newLineNumber); }
    }
  }

  return {
    oldLines: [...oldLines],
    newLines: [...newLines],
  };
}
