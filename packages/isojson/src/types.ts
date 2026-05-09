/** A JSON-safe primitive value */
export type JsonPrimitive = string | number | boolean | null;

/** Any JSON value (recursive) */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

/** A flattened row — all values are primitives */
export type FlatRow = Record<string, JsonPrimitive>;

/** Options for flatten_json */
export interface FlattenOptions {
  /** Separator between nested key segments (default: '.') */
  separator?: string;
  /** Maximum depth to flatten (default: unlimited) */
  maxDepth?: number;
  /** Keys to exclude from output */
  exclude?: string[];
  /** If true, arrays of primitives are joined as comma-separated strings (default: false) */
  arrayAsCsv?: boolean;
}

/** Schema definition for coerce_schema */
export type SchemaType = 'string' | 'number' | 'boolean' | 'date' | 'auto';
export type Schema = Record<string, SchemaType>;

/** Options for from_cosmosdb */
export interface CosmosOptions extends FlattenOptions {
  /** CosmosDB system fields to strip (_rid, _self, _etag, _attachments, _ts) */
  stripSystem?: boolean;
}
