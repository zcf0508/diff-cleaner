export function tokenizeForLineWrap(text: string, keepWhitespace = false): string[] | null {
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/\s/.test(char)) {
      if (keepWhitespace) {
        let j = i + 1;
        while (j < text.length && /\s/.test(text[j])) {
          j += 1;
        }
        tokens.push(text.slice(i, j));
        i = j;
      }
      else {
        i += 1;
      }
      continue;
    }
    if (char === '`') {
      let j = i + 1;
      let escaped = false;
      for (; j < text.length; j += 1) {
        const current = text[j];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (current === '\\') {
          escaped = true;
          continue;
        }
        if (current === '`') {
          j += 1;
          break;
        }
      }
      if (j > text.length) {
        return null;
      }
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    if (char === '\'' || char === '"') {
      const quote = char;
      let j = i + 1;
      let escaped = false;
      for (; j < text.length; j += 1) {
        const current = text[j];
        if (current === '\n' || current === '\r') {
          return null;
        }
        if (escaped) {
          escaped = false;
          continue;
        }
        if (current === '\\') {
          escaped = true;
          continue;
        }
        if (current === quote) {
          j += 1;
          break;
        }
      }
      if (j > text.length) {
        return null;
      }
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    if (char === '/' && text[i + 1] === '/') {
      let j = i + 2;
      while (j < text.length && text[j] !== '\n' && text[j] !== '\r') {
        j += 1;
      }
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    if (char === '/' && text[i + 1] === '*') {
      let j = i + 2;
      while (j < text.length - 1 && !(text[j] === '*' && text[j + 1] === '/')) {
        j += 1;
      }
      if (j >= text.length - 1) {
        return null;
      }
      j += 2;
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      let j = i + 1;
      while (j < text.length && /[A-Za-z0-9_$]/.test(text[j])) {
        j += 1;
      }
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let j = i + 1;
      while (j < text.length && /[0-9._]/.test(text[j])) {
        j += 1;
      }
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    tokens.push(char);
    i += 1;
  }
  return tokens;
}

export function normalizeLineWrapTokens(tokens: string[] | null): string[] | null {
  if (!tokens) {
    return null;
  }
  const normalized: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = tokens[i + 1];
    if (token === ',' && (next === ')' || next === '}' || next === ']')) {
      continue;
    }
    normalized.push(token);
  }
  return normalized;
}

export function isTokenSequenceEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

export function buildMultiset(values: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) || 0) + 1);
  }
  return map;
}

export function isMultisetEqual(left: Map<string, number>, right: Map<string, number>): boolean {
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
