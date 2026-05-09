import { CosmosOptions, FlatRow, JsonObject } from './types';
import { flatten_json, flatten_records } from './flatten';

const COSMOS_SYSTEM_FIELDS = new Set(['_rid', '_self', '_etag', '_attachments', '_ts', '_lsn']);

/**
 * Process a single CosmosDB document:
 * 1. Strip system fields (_rid, _self, _etag, _attachments, _ts, _lsn)
 * 2. Flatten nested structure
 */
export function from_cosmosdb(doc: JsonObject, options: CosmosOptions = {}): FlatRow {
  const { stripSystem = true, ...flatOptions } = options;

  const cleaned: JsonObject = {};
  for (const [key, value] of Object.entries(doc)) {
    if (stripSystem && COSMOS_SYSTEM_FIELDS.has(key)) continue;
    cleaned[key] = value;
  }

  return flatten_json(cleaned, flatOptions);
}

/**
 * Process an array of CosmosDB documents into IsoFrame-compatible rows.
 * Strips system fields, flattens nesting, aligns keys across all rows.
 */
export function from_cosmosdb_records(docs: JsonObject[], options: CosmosOptions = {}): FlatRow[] {
  const { stripSystem = true, ...flatOptions } = options;

  const cleaned = docs.map((doc) => {
    const c: JsonObject = {};
    for (const [key, value] of Object.entries(doc)) {
      if (stripSystem && COSMOS_SYSTEM_FIELDS.has(key)) continue;
      c[key] = value;
    }
    return c;
  });

  return flatten_records(cleaned, flatOptions);
}
