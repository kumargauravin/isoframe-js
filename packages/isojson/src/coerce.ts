import { FlatRow, JsonPrimitive, Schema, SchemaType } from './types';

function coerce_value(value: JsonPrimitive, type: SchemaType): JsonPrimitive {
  if (value === null || value === undefined) return null;

  switch (type) {
    case 'string':
      return String(value);

    case 'number': {
      const n = Number(value);
      return isNaN(n) ? null : n;
    }

    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1' || value === 1) return true;
      if (value === 'false' || value === '0' || value === 0) return false;
      return null;

    case 'date': {
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? null : d.toISOString();
    }

    case 'auto':
    default: {
      if (typeof value === 'number' || typeof value === 'boolean') return value;
      const s = String(value).trim();
      // Try number
      const n = Number(s);
      if (!isNaN(n) && s !== '') return n;
      // Try boolean
      if (s.toLowerCase() === 'true') return true;
      if (s.toLowerCase() === 'false') return false;
      // Try date (ISO-like patterns)
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      return s || null;
    }
  }
}

/**
 * Coerce the columns of a flat row according to a schema definition.
 * Columns not in the schema pass through unchanged (or are auto-coerced if schema has '*').
 *
 * @example
 * coerce_schema({ age: '25', active: 'true' }, { age: 'number', active: 'boolean' })
 * // → { age: 25, active: true }
 */
export function coerce_schema(row: FlatRow, schema: Schema): FlatRow {
  const result: FlatRow = {};
  const wildcard = schema['*'] as SchemaType | undefined;

  for (const [key, value] of Object.entries(row)) {
    const type: SchemaType = schema[key] ?? wildcard ?? 'auto';
    result[key] = coerce_value(value, type);
  }
  return result;
}

/**
 * Coerce an array of flat rows according to a schema.
 */
export function coerce_records(rows: FlatRow[], schema: Schema): FlatRow[] {
  return rows.map((r) => coerce_schema(r, schema));
}
