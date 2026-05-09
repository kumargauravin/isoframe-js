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

  function recurse(current: JsonValue, prefix: string, depth: number): void {
    if (depth > maxDepth) {
      if (prefix && !exclude.includes(prefix)) {
        result[prefix] = typeof current === 'object' ? JSON.stringify(current) : (current as any);
      }
      return;
    }

    if (current === null || current === undefined) {
      if (prefix && !exclude.includes(prefix)) result[prefix] = null;
      return;
    }

    if (Array.isArray(current)) {
      if (current.length === 0) {
        if (prefix && !exclude.includes(prefix)) result[prefix] = null;
        return;
      }
      // Array of primitives
      const allPrimitive = current.every(
        (v) => v === null || typeof v !== 'object',
      );
      if (allPrimitive) {
        if (prefix && !exclude.includes(prefix)) {
          result[prefix] = arrayAsCsv
            ? current.filter((v) => v !== null).join(',')
            : JSON.stringify(current);
        }
      } else {
        // Array of objects — stringify the whole thing
        if (prefix && !exclude.includes(prefix)) {
          result[prefix] = JSON.stringify(current);
        }
      }
      return;
    }

    if (typeof current === 'object') {
      const keys = Object.keys(current as JsonObject);
      if (keys.length === 0) {
        if (prefix && !exclude.includes(prefix)) result[prefix] = null;
        return;
      }
      for (const key of keys) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        recurse((current as JsonObject)[key], newKey, depth + 1);
      }
      return;
    }

    // Primitive
    if (prefix && !exclude.includes(prefix)) {
      result[prefix] = current as any;
    }
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
