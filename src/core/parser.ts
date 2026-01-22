import type { DiffFile, DiffHunk, DiffLine } from '../types';

export class DiffParser {
  /**
   * Parse unified diff text
   */
  parse(diffText: string): DiffFile[] {
    const files: DiffFile[] = [];
    const lines = diffText.split(/\r?\n/);
    let currentFile: DiffFile | null = null;
    let currentHunk: DiffHunk | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Handle file headers (diff --git)
      if (line.startsWith('diff --git')) {
        currentFile = this.initDiffFile(line);
        files.push(currentFile);
        currentHunk = null;
        continue;
      }

      if (!currentFile) { continue; }

      // 2. Handle file metadata
      if (this.parseMetadata(line, currentFile)) {
        continue;
      }

      // 3. Handle hunk headers (@@ -L,C +L,C @@)
      const hunkHeaderMatch = line.match(/^@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
      if (hunkHeaderMatch) {
        currentHunk = {
          oldStart: Number.parseInt(hunkHeaderMatch[1], 10),
          oldLines: 0, // Start at 0 and increment based on content lines
          newStart: Number.parseInt(hunkHeaderMatch[3], 10),
          newLines: 0, // Start at 0 and increment based on content lines
          header: line,
          lines: [],
        };
        currentFile.hunks.push(currentHunk);
        continue;
      }

      // 4. Handle hunk content
      if (currentHunk) {
        const firstChar = line[0];
        let type: 'add' | 'remove' | 'context' | null = null;
        let content = line.slice(1);

        if (firstChar === '+') {
          type = 'add';
        }
        else if (firstChar === '-') {
          type = 'remove';
        }
        else if (firstChar === ' ' || line === '' || (line.length > 0 && firstChar !== '@' && firstChar !== 'd')) {
          type = 'context';
          if (line === '') { content = ''; }
          else if (firstChar !== ' ') { content = line; } // Handle context lines missing a leading space
        }
        else if (line === '\\ No newline at end of file') {
          // Ignore this line for now, but consider it during reconstruction if needed
          continue;
        }

        if (type) {
          const diffLine: DiffLine = { type, content };
          this.assignLineNumbers(diffLine, currentHunk);
          currentHunk.lines.push(diffLine);

          // Update hunk line counts to keep detector logic accurate
          if (type === 'add') {
            currentHunk.newLines++;
          }
          else if (type === 'remove') {
            currentHunk.oldLines++;
          }
          else {
            currentHunk.oldLines++;
            currentHunk.newLines++;
          }
        }
      }
    }

    return files;
  }

  private initDiffFile(line: string): DiffFile {
    // Parse diff --git a/path b/path
    const parts = line.split(' ');
    const from = parts[2]?.slice(2); // Remove a/
    const to = parts[3]?.slice(2); // Remove b/

    return {
      path: to || from || '',
      from,
      to,
      type: 'modify',
      hunks: [],
      metadata: {},
    };
  }

  private parseMetadata(line: string, file: DiffFile): boolean {
    if (line.startsWith('new file mode')) {
      file.type = 'add';
      file.metadata!.newMode = line.split(' ').pop();
      return true;
    }
    if (line.startsWith('deleted file mode')) {
      file.type = 'delete';
      file.metadata!.oldMode = line.split(' ').pop();
      return true;
    }
    if (line.startsWith('rename from')) {
      file.type = 'rename';
      file.from = line.split(' ').pop();
      return true;
    }
    if (line.startsWith('rename to')) {
      file.type = 'rename';
      file.to = line.split(' ').pop();
      return true;
    }
    if (line.startsWith('similarity index')) {
      file.metadata!.similarity = Number.parseInt(line.split(' ').pop()!.replace('%', ''), 10);
      return true;
    }
    if (line.startsWith('index')) {
      file.metadata!.index = line.split(' ').pop()?.split('..');
      return true;
    }
    if (line.startsWith('---') || line.startsWith('+++')) {
      // Capture file names even if diff --git is missing after index
      if (line.startsWith('--- a/')) { file.from = line.slice(6); }
      if (line.startsWith('+++ b/')) { file.to = line.slice(6); }
      return true;
    }
    return false;
  }

  private assignLineNumbers(line: DiffLine, hunk: DiffHunk): void {
    if (line.type === 'add') {
      line.newLineNumber = hunk.newStart + hunk.newLines;
    }
    else if (line.type === 'remove') {
      line.oldLineNumber = hunk.oldStart + hunk.oldLines;
    }
    else {
      line.oldLineNumber = hunk.oldStart + hunk.oldLines;
      line.newLineNumber = hunk.newStart + hunk.newLines;
    }
  }
}
