import type { CleanDiffConfig, DiffHunk, DiffLine, FormattingChange } from '../types';

export class FormatDetector {
  detect(hunk: DiffHunk, config: CleanDiffConfig, filePath?: string): FormattingChange[] {
    const changes: FormattingChange[] = [];
    const pairs = this.findChangePairs(hunk.lines);

    if (config.ignoreWhitespace) {
      const whitespaceChanges = this.detectWhitespaceChanges(hunk, pairs);
      if (whitespaceChanges.length > 0) {
        changes.push({
          type: 'whitespace',
          severity: 'low',
          description: 'Detected whitespace-only changes',
          lines: whitespaceChanges,
          filePath,
        });
      }
    }

    if (config.ignoreCommentChanges) {
      const commentChanges = this.detectCommentChanges(hunk, pairs);
      if (commentChanges.length > 0) {
        changes.push({
          type: 'comment',
          severity: 'low',
          description: 'Detected comment-only changes',
          lines: commentChanges,
          filePath,
        });
      }
    }

    if (config.ignoreQuoteChanges) {
      const quoteChanges = this.detectQuoteChanges(pairs);
      if (quoteChanges.length > 0) {
        changes.push({
          type: 'quote',
          severity: 'low',
          description: 'Detected quote-style-only changes',
          lines: quoteChanges,
          filePath,
        });
      }
    }

    if (config.ignoreTrailingCommas) {
      const commaChanges = this.detectTrailingCommaChanges(pairs);
      if (commaChanges.length > 0) {
        changes.push({
          type: 'trailing-comma',
          severity: 'low',
          description: 'Detected trailing-comma-only changes',
          lines: commaChanges,
          filePath,
        });
      }
    }

    if (config.ignoreOptionalSemicolons) {
      const semiChanges = this.detectSemicolonChanges(hunk, pairs);
      if (semiChanges.length > 0) {
        changes.push({
          type: 'semicolon',
          severity: 'low',
          description: 'Detected semicolon-only changes',
          lines: semiChanges,
          filePath,
        });
      }
    }

    if (config.ignoreImportReordering) {
      const importChanges = this.detectImportReordering(hunk, filePath);
      if (importChanges.length > 0) {
        changes.push({
          type: 'import',
          severity: 'low',
          description: 'Detected import reordering only',
          lines: importChanges,
          filePath,
        });
      }
    }

    return changes;
  }

  private detectWhitespaceChanges(hunk: DiffHunk, pairs: ChangePair[]): number[] {
    const affectedLines = new Set<number>();

    for (const pair of pairs) {
      if (this.isWhitespaceOnlyChange(pair.remove.content, pair.add.content)) {
        this.addLineNumber(affectedLines, pair.remove);
        this.addLineNumber(affectedLines, pair.add);
      }
    }

    for (const line of hunk.lines) {
      if (line.type !== 'context' && line.content.trim() === '') {
        this.addLineNumber(affectedLines, line);
      }
    }

    return [...affectedLines];
  }

  private detectCommentChanges(hunk: DiffHunk, pairs: ChangePair[]): number[] {
    const affectedLines = new Set<number>();

    for (const pair of pairs) {
      if (this.isCommentOnlyChange(pair.remove.content, pair.add.content)) {
        this.addLineNumber(affectedLines, pair.remove);
        this.addLineNumber(affectedLines, pair.add);
      }
    }

    for (const line of hunk.lines) {
      if (line.type !== 'context' && this.isCommentLine(line.content)) {
        this.addLineNumber(affectedLines, line);
      }
    }

    return [...affectedLines];
  }

  private detectQuoteChanges(pairs: ChangePair[]): number[] {
    const affectedLines = new Set<number>();

    for (const pair of pairs) {
      if (this.isQuoteOnlyChange(pair.remove.content, pair.add.content)) {
        this.addLineNumber(affectedLines, pair.remove);
        this.addLineNumber(affectedLines, pair.add);
      }
    }

    return [...affectedLines];
  }

  private detectTrailingCommaChanges(pairs: ChangePair[]): number[] {
    const affectedLines = new Set<number>();

    for (const pair of pairs) {
      if (this.isTrailingCommaOnlyChange(pair.remove.content, pair.add.content)) {
        this.addLineNumber(affectedLines, pair.remove);
        this.addLineNumber(affectedLines, pair.add);
      }
    }

    return [...affectedLines];
  }

  private detectSemicolonChanges(hunk: DiffHunk, pairs: ChangePair[]): number[] {
    const affectedLines = new Set<number>();

    for (const pair of pairs) {
      if (this.isSemicolonOnlyChange(pair.remove.content, pair.add.content, hunk.lines[pair.addIndex + 1])) {
        this.addLineNumber(affectedLines, pair.remove);
        this.addLineNumber(affectedLines, pair.add);
      }
    }

    return [...affectedLines];
  }

  private detectImportReordering(hunk: DiffHunk, filePath?: string): number[] {
    if (!filePath || !this.isImportSupportedFile(filePath)) {
      return [];
    }

    const affectedLines = new Set<number>();
    let blockLines: DiffLine[] = [];

    const flushBlock = (): void => {
      if (blockLines.length === 0) { return; }
      const removed = blockLines.filter(l => l.type === 'remove');
      const added = blockLines.filter(l => l.type === 'add');
      if (removed.length === 0 || added.length === 0) {
        blockLines = [];
        return;
      }

      const allImport = blockLines.every(line => this.isImportLine(line.content, filePath));
      if (!allImport) {
        blockLines = [];
        return;
      }

      const removedSet = this.buildMultiset(removed.map(l => l.content.trim()));
      const addedSet = this.buildMultiset(added.map(l => l.content.trim()));
      if (this.isMultisetEqual(removedSet, addedSet)) {
        for (const line of blockLines) {
          this.addLineNumber(affectedLines, line);
        }
      }
      blockLines = [];
    };

    for (const line of hunk.lines) {
      if (line.type !== 'context') {
        blockLines.push(line);
      }
      else {
        flushBlock();
      }
    }
    flushBlock();

    return [...affectedLines];
  }

  private findChangePairs(lines: DiffLine[]): ChangePair[] {
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

  private addLineNumber(target: Set<number>, line: DiffLine): void {
    const lineNumber = line.type === 'add'
      ? line.newLineNumber
      : line.oldLineNumber;
    if (lineNumber !== undefined) {
      target.add(lineNumber);
    }
  }

  private isWhitespaceOnlyChange(oldStr: string, newStr: string): boolean {
    if (this.hasQuote(oldStr) || this.hasQuote(newStr)) {
      return false;
    }
    const oldNormalized = oldStr.replace(/\s+/g, ' ').trim();
    const newNormalized = newStr.replace(/\s+/g, ' ').trim();
    return oldNormalized === newNormalized && oldNormalized.length > 0;
  }

  private isCommentOnlyChange(oldStr: string, newStr: string): boolean {
    const oldTrim = oldStr.trim();
    const newTrim = newStr.trim();

    return (
      this.isCommentLine(oldTrim)
      && this.isCommentLine(newTrim)
      && oldTrim !== newTrim
    );
  }

  private isQuoteOnlyChange(oldStr: string, newStr: string): boolean {
    const hasInterpolation = (s: string): boolean => /\${.*}/.test(s);
    if (hasInterpolation(oldStr) || hasInterpolation(newStr)) {
      return false;
    }

    const normalizeQuotes = (s: string): string => s.replace(/['"`]/g, '"');
    const normalizedOld = normalizeQuotes(oldStr);
    const normalizedNew = normalizeQuotes(newStr);

    return normalizedOld === normalizedNew && oldStr !== newStr;
  }

  private isTrailingCommaOnlyChange(oldStr: string, newStr: string): boolean {
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

  private isSemicolonOnlyChange(oldStr: string, newStr: string, nextLine?: DiffLine): boolean {
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

  private isCommentLine(content: string): boolean {
    return /^(\/\/|\/\*|\*|#|--)/.test(content.trim());
  }

  private hasQuote(content: string): boolean {
    return /['"`]/.test(content);
  }

  private isImportSupportedFile(filePath: string): boolean {
    return /\.(ts|tsx|js|jsx|mjs|cjs|go)$/.test(filePath);
  }

  private isImportLine(content: string, filePath: string): boolean {
    const trimmed = content.trim();
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) {
      return /^import\s|^export\s|require\(|from\s/.test(trimmed);
    }
    if (/\.go$/.test(filePath)) {
      return trimmed.startsWith('import ')
        || trimmed.startsWith('"')
        || trimmed.startsWith('`')
        || trimmed.startsWith('.');
    }
    return false;
  }

  private buildMultiset(values: string[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const value of values) {
      map.set(value, (map.get(value) || 0) + 1);
    }
    return map;
  }

  private isMultisetEqual(left: Map<string, number>, right: Map<string, number>): boolean {
    if (left.size !== right.size) {
      return false;
    }
    for (const [key, value] of left.entries()) {
      if (right.get(key) !== value) {
        return false;
      }
    }
    return true;
  }
}

interface ChangePair {
  remove: DiffLine
  add: DiffLine
  removeIndex: number
  addIndex: number
}
