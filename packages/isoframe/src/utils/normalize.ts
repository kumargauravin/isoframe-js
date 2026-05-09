import { ColumnMap, FrameInput, Row, Scalar } from '../types';

/** Detect whether input is column-major (key→array) or row-major (array of dicts). */
function isColumnMap(input: FrameInput): input is ColumnMap {
  if (Array.isArray(input)) return false;
  const values = Object.values(input);
  return values.length > 0 && Array.isArray(values[0]);
}

/** Normalize any FrameInput into an immutable array of row objects. */
export function normalizeInput(input: FrameInput): ReadonlyArray<Row> {
  if (!input) return Object.freeze([]);

  if (isColumnMap(input)) {
    const keys = Object.keys(input);
    if (keys.length === 0) return Object.freeze([]);
    const len = input[keys[0]].length;
    const rows: Row[] = new Array(len);
    for (let i = 0; i < len; i++) {
      const row: Row = {};
      for (const k of keys) {
        row[k] = input[k][i] ?? null;
      }
      rows[i] = Object.freeze(row) as Row;
    }
    return Object.freeze(rows);
  }

  // Array of row objects
  return Object.freeze(
    (input as Row[]).map((r) => Object.freeze({ ...r }) as Row),
  );
}

/** Convert row array to column-major object */
export function toColumnMap(rows: ReadonlyArray<Row>): ColumnMap {
  if (rows.length === 0) return {};
  const keys = inferColumns(rows);
  const result: ColumnMap = {};
  for (const k of keys) {
    result[k] = rows.map((r) => (k in r ? r[k] : null) as Scalar);
  }
  return result;
}

/** Infer column names from row array */
export function inferColumns(rows: ReadonlyArray<Row>): string[] {
  if (rows.length === 0) return [];
  // Union of all keys across rows
  const set = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      set.add(k);
    }
  }
  return [...set];
}
