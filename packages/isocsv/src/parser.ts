import { Row, Scalar } from '@nice-tools/isoframe';
import { ParseOptions, ParseResult } from './types';

function tryNumber(s: string): Scalar {
  if (s === '') return null;
  const n = Number(s);
  return isNaN(n) ? s : n;
}

function splitLine(line: string, delimiter: string): string[] {
  // RFC 4180 compliant quoted field parser
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (line.startsWith(delimiter, i)) {
        fields.push(field);
        field = '';
        i += delimiter.length;
      } else {
        field += ch;
        i++;
      }
    }
  }
  fields.push(field);
  return fields;
}

export function parseCSV(text: string, options: ParseOptions = {}): ParseResult {
  const {
    delimiter = ',',
    header = true,
    columns: customCols,
    skipBlank = true,
    emptyValue = null,
    inferTypes = true,
    comment,
  } = options;

  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  const result: Row[] = [];
  let cols: string[] = [];
  let startLine = 0;

  // Filter comments and blank lines, preserving original line numbers for error reporting
  const activeLines: { text: string; originalLineNum: number }[] = [];
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (skipBlank && line.trim() === '') continue;
    if (comment && line.startsWith(comment)) continue;
    activeLines.push({ text: line, originalLineNum: li + 1 });
  }

  if (activeLines.length === 0) {
    return { rows: [], columns: [], errors };
  }

  if (header) {
    cols = splitLine(activeLines[0].text, delimiter).map((c) => c.trim());
    startLine = 1;
  } else if (customCols) {
    cols = customCols;
    startLine = 0;
  } else {
    // Auto-generate column names
    const firstFields = splitLine(activeLines[0].text, delimiter);
    cols = firstFields.map((_, i) => `col${i}`);
    startLine = 0;
  }

  for (let i = startLine; i < activeLines.length; i++) {
    const { text: line, originalLineNum } = activeLines[i];
    const fields = splitLine(line, delimiter);

    if (fields.length !== cols.length) {
      errors.push(`Line ${originalLineNum}: expected ${cols.length} fields, got ${fields.length}`);
    }

    const row: Row = {};
    for (let j = 0; j < cols.length; j++) {
      const raw = fields[j] ?? '';
      const trimmed = raw.trim();
      if (trimmed === '') {
        row[cols[j]] = emptyValue as Scalar;
      } else {
        row[cols[j]] = inferTypes ? tryNumber(trimmed) : trimmed;
      }
    }
    result.push(Object.freeze(row) as Row);
  }

  return { rows: result, columns: cols, errors };
}

export function stringifyCSV(rows: Row[], columns?: string[], delimiter = ','): string {
  if (rows.length === 0) return '';
  const cols = columns ?? Object.keys(rows[0]);
  const escape = (v: Scalar): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(delimiter) || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [cols.join(delimiter)];
  for (const row of rows) {
    lines.push(cols.map((c) => escape(row[c] as Scalar)).join(delimiter));
  }
  return lines.join('\n');
}
