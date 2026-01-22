export interface CleanDiffConfig {
  /** Ignore whitespace-only changes */
  ignoreWhitespace?: boolean
  /** Ignore comment-only changes */
  ignoreCommentChanges?: boolean
  /** Ignore import reordering (JS/TS/Go only) */
  ignoreImportReordering?: boolean
  /** Ignore line break changes */
  ignoreLineBreaks?: boolean
  ignoreLineWrappingChanges?: boolean
  /** Ignore quote style changes */
  ignoreQuoteChanges?: boolean
  /** Ignore trailing comma changes */
  ignoreTrailingCommas?: boolean
  /** Ignore optional semicolon changes */
  ignoreOptionalSemicolons?: boolean
  /** Language hint for language-specific optimizations */
  language?: string
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  header: string
  lines: DiffLine[]
}

export interface DiffFile {
  path: string
  to?: string
  from?: string
  type: 'add' | 'delete' | 'modify' | 'rename'
  hunks: DiffHunk[]
  metadata?: {
    newMode?: string
    oldMode?: string
    similarity?: number
    index?: string[]
  }
}

export interface FormattingChange {
  type: 'whitespace' | 'comment' | 'import' | 'linebreak' | 'indent' | 'quote' | 'trailing-comma' | 'semicolon' | 'line-wrap' | 'custom'
  severity: 'high' | 'medium' | 'low'
  description: string
  lines: number[]
  filePath?: string
}

export interface CleanedDiff {
  original: DiffFile[]
  cleaned: DiffFile[]
  formatChanges: FormattingChange[]
  statistics: {
    totalFiles: number
    filesWithFormatChanges: number
    linesRemoved: number
    percentageReduced: number
  }
}
