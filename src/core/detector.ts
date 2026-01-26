import type { CleanDiffConfig, DiffHunk, FormattingChange } from '../types';
import type { ChangePair } from './utils/change-pair';
import { detectTrailingCommaChanges } from './detectors/comma-detector';
import { detectCommentChanges } from './detectors/comment-detector';
import { detectImportReordering } from './detectors/import-detector';
import { detectLineWrapChanges } from './detectors/line-wrap-detector';
import { detectQuoteChanges } from './detectors/quote-detector';
import { detectSemicolonChanges } from './detectors/semicolon-detector';
import { detectWhitespaceChanges } from './detectors/whitespace-detector';
import { findChangePairs } from './utils/change-pair';

export class FormatDetector {
  private hunkPairsMap = new Map<DiffHunk, ChangePair[]>();

  detect(hunk: DiffHunk, config: CleanDiffConfig, filePath?: string): FormattingChange[] {
    this.hunkPairsMap.clear(); // Clear pairs from previous hunk
    const changes: FormattingChange[] = [];
    const pairs = this.getPairsForHunk(hunk);
    const extraPairs: ChangePair[] = [];

    if (config.ignoreWhitespace) {
      const { oldLines, newLines } = detectWhitespaceChanges(hunk, pairs);
      if (oldLines.length > 0 || newLines.length > 0) {
        changes.push({
          type: 'whitespace',
          severity: 'low',
          description: 'Detected whitespace-only changes',
          lines: [...new Set([...oldLines, ...newLines])],
          oldLines,
          newLines,
          filePath,
        });
      }
    }

    if (config.ignoreCommentChanges) {
      const { oldLines, newLines } = detectCommentChanges(hunk, pairs);
      if (oldLines.length > 0 || newLines.length > 0) {
        changes.push({
          type: 'comment',
          severity: 'low',
          description: 'Detected comment-only changes',
          lines: [...new Set([...oldLines, ...newLines])],
          oldLines,
          newLines,
          filePath,
        });
      }
    }

    if (config.ignoreLineWrappingChanges) {
      const { oldLines, newLines } = detectLineWrapChanges(hunk, filePath);
      if (oldLines.length > 0 || newLines.length > 0) {
        changes.push({
          type: 'line-wrap',
          severity: 'low',
          description: 'Detected line-wrapping-only changes',
          lines: [...new Set([...oldLines, ...newLines])],
          oldLines,
          newLines,
          filePath,
        });
      }
    }

    if (config.ignoreQuoteChanges) {
      const { oldLines, newLines } = detectQuoteChanges(pairs);
      if (oldLines.length > 0 || newLines.length > 0) {
        changes.push({
          type: 'quote',
          severity: 'low',
          description: 'Detected quote-style-only changes',
          lines: [...new Set([...oldLines, ...newLines])],
          oldLines,
          newLines,
          filePath,
        });
      }
    }

    if (config.ignoreTrailingCommas) {
      const { oldLines, newLines } = detectTrailingCommaChanges(pairs);
      if (oldLines.length > 0 || newLines.length > 0) {
        changes.push({
          type: 'trailing-comma',
          severity: 'low',
          description: 'Detected trailing-comma-only changes',
          lines: [...new Set([...oldLines, ...newLines])],
          oldLines,
          newLines,
          filePath,
        });
      }
    }

    if (config.ignoreOptionalSemicolons) {
      const { oldLines, newLines } = detectSemicolonChanges(hunk, pairs);
      if (oldLines.length > 0 || newLines.length > 0) {
        changes.push({
          type: 'semicolon',
          severity: 'low',
          description: 'Detected semicolon-only changes',
          lines: [...new Set([...oldLines, ...newLines])],
          oldLines,
          newLines,
          filePath,
        });
      }
    }

    if (config.ignoreImportReordering) {
      const { oldLines, newLines, pairs: importPairs } = detectImportReordering(hunk, filePath);
      if (oldLines.length > 0 || newLines.length > 0) {
        extraPairs.push(...importPairs);
        changes.push({
          type: 'import',
          severity: 'low',
          description: 'Detected import-reordering changes',
          lines: [...new Set([...oldLines, ...newLines])],
          oldLines,
          newLines,
          filePath,
        });
      }
    }

    if (extraPairs.length > 0) {
      this.hunkPairsMap.set(hunk, [...pairs, ...extraPairs]);
    }

    return changes;
  }

  getPairsForHunk(hunk: DiffHunk): ChangePair[] {
    return this.hunkPairsMap.get(hunk) || findChangePairs(hunk.lines);
  }
}
