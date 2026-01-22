import type { CleanDiffConfig, CleanedDiff, DiffFile } from './types';
import { DiffFilter } from './core/filter';
import { DiffParser } from './core/parser';
import { DiffReconstructor } from './core/reconstructor';

export class DiffCleaner {
  private parser = new DiffParser();
  private reconstructor = new DiffReconstructor();
  private filterEngine = new DiffFilter();

  /**
   * Clean diff text
   */
  clean(diffText: string, config: CleanDiffConfig): CleanedDiff {
    const originalFiles = this.parser.parse(diffText);
    const { cleaned: cleanedFiles, changes, filesWithChanges } = this.filterEngine.filter(originalFiles, config);

    const linesRemoved = this.calculateLinesRemoved(originalFiles, cleanedFiles);

    return {
      original: originalFiles,
      cleaned: cleanedFiles,
      formatChanges: changes,
      statistics: {
        totalFiles: originalFiles.length,
        filesWithFormatChanges: filesWithChanges.length,
        linesRemoved,
        percentageReduced: this.calculateReduction(originalFiles, linesRemoved),
      },
    };
  }

  /**
   * Get reconstructed diff text
   */
  reconstruct(files: DiffFile[]): string {
    return this.reconstructor.reconstruct(files);
  }

  private calculateLinesRemoved(original: DiffFile[], cleaned: DiffFile[]): number {
    const countLines = (files: DiffFile[]): number =>
      files.reduce((acc, f) => acc + f.hunks.reduce((hAcc, h) => hAcc + h.lines.filter(l => l.type !== 'context').length, 0), 0);

    return countLines(original) - countLines(cleaned);
  }

  private calculateReduction(original: DiffFile[], removed: number): number {
    const total = original.reduce((acc, f) => acc + f.hunks.reduce((hAcc, h) => hAcc + h.lines.length, 0), 0);
    return total === 0
      ? 0
      : (removed / total) * 100;
  }
}

export * from './types';
