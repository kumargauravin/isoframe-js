import { FlatRow, FlattenOptions, JsonObject, JsonValue } from './types';

/**
 * Flatten a nested JSON object into a single-level record.
 * Arrays of objects are NOT expanded (they become a JSON string or are skipped).
 * Arrays of primitives are either joined as CSV or JSON-stringified depending on options.
 *
 * @example
 * flatten_json({ a: { b: 1 }, c: 2 }) // { 'a.b': 1, c: 2 }
 */
export function flatten_json(obj: JsonObject, options: FlattenOptions = {}): FlatRow {
  const { separator = '.', maxDepth = Infinity, exclude = [], arrayAsCsv = false } = options;
  const result: FlatRow = {};

  function shouldWrite(prefix: string): boolean {
    return !!prefix && !exclude.includes(prefix);
  }

  function writeIfAllowed(prefix: string, value: FlatRow[string]): void {
    if (shouldWrite(prefix)) result[prefix] = value;
  }

  function handleArray(current: JsonValue[], prefix: string): void {
    if (current.length === 0) {
      writeIfAllowed(prefix, null);
      return;
    }
    if (!shouldWrite(prefix)) return;
    const allPrimitive = current.every((v) => v === null || typeof v !== 'object');
    if (allPrimitive) {
      result[prefix] = arrayAsCsv
        ? current.filter((v) => v !== null).join(',')
        : JSON.stringify(current);
    } else {
      result[prefix] = JSON.stringify(current);
    }
  }

  function handleObject(current: JsonObject, prefix: string, depth: number): void {
    const keys = Object.keys(current);
    if (keys.length === 0) {
      writeIfAllowed(prefix, null);
      return;
    }
    for (const key of keys) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      recurse(current[key], newKey, depth + 1);
    }
  }

  function recurse(current: JsonValue, prefix: string, depth: number): void {
    if (current === null || current === undefined) {
      writeIfAllowed(prefix, null);
      return;
    }
    if (depth > maxDepth) {
      const val = typeof current === 'object' ? JSON.stringify(current) : (current as FlatRow[string]);
      writeIfAllowed(prefix, val);
      return;
    }
    if (Array.isArray(current)) {
      handleArray(current, prefix);
      return;
    }
    if (typeof current === 'object') {
      handleObject(current as JsonObject, prefix, depth);
      return;
    }
    // Primitive
    writeIfAllowed(prefix, current as FlatRow[string]);
  }

  recurse(obj, '', 0);
  return result;
}

/**
 * Flatten an array of nested JSON objects into an array of flat rows.
 * Missing keys across rows are filled with null.
 */
export function flatten_records(
  records: JsonObject[],
  options: FlattenOptions = {},
): FlatRow[] {
  if (records.length === 0) return [];

  const rows = records.map((r) => flatten_json(r, options));

  // Union all keys
  const allKeys = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) allKeys.add(k);
  }

  // Fill missing keys with null
  return rows.map((row) => {
    const filled: FlatRow = {};
    for (const k of allKeys) {
      filled[k] = k in row ? row[k] : null;
    }
    return filled;
  });
}
