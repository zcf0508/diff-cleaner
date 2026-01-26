import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'vitest';
import { DiffCleaner } from '../src/index';

describe('DiffCleaner: a.diff Analysis', () => {
  const cleaner = new DiffCleaner();

  it('should clean a.diff and show why iknow is retained', () => {
    const aDiffPath = path.join(__dirname, '../a.diff');
    const aDiff = fs.readFileSync(aDiffPath, 'utf-8');

    console.log('--- Cleaning a.diff ---');
    const result = cleaner.clean(aDiff, {
      ignoreWhitespace: true,
      ignoreCommentChanges: true,
      ignoreLineWrappingChanges: true,
      ignoreQuoteChanges: true,
      ignoreTrailingCommas: true,
      ignoreOptionalSemicolons: true,
    });

    const reconstructed = cleaner.reconstruct(result.cleaned);
    // console.log('Reconstructed Output:\n', reconstructed);

    // Check if iknow is still there
    const hasIknow = reconstructed.includes('iknow');
    const hasIknowDelete = reconstructed.includes('-      iknow: false,//【管理伙伴】的知道了');

    console.log('Result has iknow:', hasIknow);
    console.log('Result has iknow deletion line:', hasIknowDelete);
  });
});
