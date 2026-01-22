import type { ChangePair } from '../utils/change-pair';
import { addLineNumber } from '../utils/change-pair';

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

export function detectQuoteChanges(pairs: ChangePair[]): number[] {
  const affectedLines = new Set<number>();

  for (const pair of pairs) {
    if (isQuoteOnlyChange(pair.remove.content, pair.add.content)) {
      addLineNumber(affectedLines, pair.remove);
      addLineNumber(affectedLines, pair.add);
    }
  }

  return [...affectedLines];
}
