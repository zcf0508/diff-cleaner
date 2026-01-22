export function isLineWrapSupportedFile(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath);
}

export function isImportSupportedFile(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs|go)$/.test(filePath);
}

export function isImportLine(content: string, filePath: string): boolean {
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

export function isCommentLine(content: string): boolean {
  return /^(\/\/|\/\*|\*|#|--)/.test(content.trim());
}
