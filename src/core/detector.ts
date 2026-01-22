import type { CleanDiffConfig, DiffHunk, FormattingChange } from '../types';
import { detectTrailingCommaChanges } from './detectors/comma-detector';
import { detectCommentChanges } from './detectors/comment-detector';
import { detectImportReordering } from './detectors/import-detector';
import { detectLineWrapChanges } from './detectors/line-wrap-detector';
import { detectQuoteChanges } from './detectors/quote-detector';
import { detectSemicolonChanges } from './detectors/semicolon-detector';
import { detectWhitespaceChanges } from './detectors/whitespace-detector';
import { findChangePairs } from './utils/change-pair';

export class FormatDetector {
  detect(hunk: DiffHunk, config: CleanDiffConfig, filePath?: string): FormattingChange[] {
    const changes: FormattingChange[] = [];
    const pairs = findChangePairs(hunk.lines);

    if (config.ignoreWhitespace) {
      const whitespaceChanges = detectWhitespaceChanges(hunk, pairs);
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
      const commentChanges = detectCommentChanges(hunk, pairs);
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

    if (config.ignoreLineWrappingChanges) {
      const wrapChanges = detectLineWrapChanges(hunk, filePath);
      if (wrapChanges.length > 0) {
        changes.push({
          type: 'line-wrap',
          severity: 'low',
          description: 'Detected line-wrapping-only changes',
          lines: wrapChanges,
          filePath,
        });
      }
    }

    if (config.ignoreQuoteChanges) {
      const quoteChanges = detectQuoteChanges(pairs);
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
      const commaChanges = detectTrailingCommaChanges(pairs);
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
      const semiChanges = detectSemicolonChanges(hunk, pairs);
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
      const importChanges = detectImportReordering(hunk, filePath);
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
}
